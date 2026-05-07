"use strict"

const db = require("../models")
const { Op } = require("sequelize")
const { User, Client, Nutritionist, ClientNutritionistRelationship, Meal, MealPlan, MealPlanItem } = db

module.exports.browse_nutritionists = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 12
    const offset = (page - 1) * limit

    const nutritionists = await User.findAndCountAll({
      where: { role: "nutritionist", is_active: true },
      attributes: ["user_id", "first_name", "last_name", "profile_pic"],
      include: [{ model: Nutritionist, required: true, where: { is_approved: true } }],
      limit,
      offset,
      order: [["user_id", "ASC"]],
    })

    return res.json({
      totalItems: nutritionists.count,
      totalPages: Math.ceil(nutritionists.count / limit),
      currentPage: page,
      data: nutritionists.rows,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports.get_nutritionist = async (req, res) => {
  try {
    const nutritionistUserId = parseInt(req.params.nutritionistUserId)
    if (isNaN(nutritionistUserId)) return res.status(400).json({ error: "Invalid nutritionist id" })

    const nutritionist = await User.findOne({
      where: { user_id: nutritionistUserId, role: "nutritionist", is_active: true },
      attributes: ["user_id", "first_name", "last_name", "profile_pic"],
      include: [{ model: Nutritionist, required: true }],
    })

    if (!nutritionist) return res.status(404).json({ error: "Nutritionist not found" })

    return res.json(nutritionist)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports.get_my_nutritionist = async (req, res) => {
  try {
    const clientUserId = req.user.user_id

    const relationship = await ClientNutritionistRelationship.findOne({
      where: { client_user_id: clientUserId, status: { [Op.in]: ["pending", "active"] } },
      include: [{
        model: User,
        as: "nutritionist",
        attributes: ["user_id", "first_name", "last_name", "profile_pic"],
        include: [{ model: Nutritionist }],
      }],
    })

    if (!relationship) return res.json({ state: "none", nutritionist: null })

    return res.json({ state: relationship.status, nutritionist: relationship.nutritionist })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports.unhire_nutritionist = async (req, res) => {
  try {
    const clientUserId = req.user.user_id

    const active = await ClientNutritionistRelationship.findOne({
      where: { client_user_id: clientUserId, status: "active" },
    })

    if (!active) return res.status(404).json({ error: "No active nutritionist to unhire" })

    active.status = "inactive"
    active.end_date = new Date().toISOString().split("T")[0]
    await active.save()

    return res.status(204).send()
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports.request_nutritionist = async (req, res) => {
  try {
    const clientUserId = req.user.user_id
    const nutritionistUserId = parseInt(req.params.nutritionistUserId)

    if (isNaN(nutritionistUserId)) return res.status(400).json({ error: "Invalid nutritionist id" })

    const nutritionist = await User.findOne({
      where: { user_id: nutritionistUserId, role: "nutritionist", is_active: true },
    })

    if (!nutritionist) return res.status(404).json({ error: "Nutritionist not found" })

    const existing = await ClientNutritionistRelationship.findOne({
      where: { client_user_id: clientUserId, status: { [Op.in]: ["pending", "active"] } },
    })

    if (existing) return res.status(409).json({ error: "You already have a pending or active nutritionist" })

    const [relationship] = await ClientNutritionistRelationship.findOrCreate({
      where: { client_user_id: clientUserId, nutritionist_user_id: nutritionistUserId },
      defaults: { status: "pending", start_date: null, end_date: null },
    })

    await relationship.update({ status: "pending", start_date: null, end_date: null })

    return res.status(201).json({ message: "Request sent" })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports.get_clients = async (req, res) => {
  try {
    const nutritionistId = req.user.user_id

    const relationships = await ClientNutritionistRelationship.findAll({
      where: { nutritionist_user_id: nutritionistId, status: "active" },
      include: [{
        model: User,
        as: "client",
        attributes: ["user_id", "first_name", "last_name", "profile_pic", "email"],
        include: [{ model: Client, attributes: ["goal", "diet_preference", "weight", "height"] }],
      }],
    })

    const data = relationships.map((r) => ({
      client_user_id: r.client_user_id,
      start_date: r.start_date,
      first_name: r.client.first_name,
      last_name: r.client.last_name,
      profile_pic: r.client.profile_pic,
      email: r.client.email,
      goal: r.client.Client?.goal || null,
      diet_preference: r.client.Client?.diet_preference || null,
      weight: r.client.Client?.weight || null,
      height: r.client.Client?.height || null,
    }))

    return res.json({ totalItems: data.length, data })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports.get_pending_requests = async (req, res) => {
  try {
    const nutritionistId = req.user.user_id

    const requests = await ClientNutritionistRelationship.findAll({
      where: { nutritionist_user_id: nutritionistId, status: "pending" },
      include: [{
        model: User,
        as: "client",
        attributes: ["user_id", "first_name", "last_name", "profile_pic"],
        include: [{ model: Client, attributes: ["goal", "diet_preference", "nutritionist_help"] }],
      }],
    })

    const data = requests.map((r) => ({
      client_user_id: r.client_user_id,
      first_name: r.client.first_name,
      last_name: r.client.last_name,
      profile_pic: r.client.profile_pic,
      goal: r.client.Client?.goal || null,
      diet_preference: r.client.Client?.diet_preference || null,
      nutritionist_help: r.client.Client?.nutritionist_help || null,
    }))

    return res.json({ totalItems: data.length, data })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports.approve_request = async (req, res) => {
  try {
    const nutritionistId = req.user.user_id
    const clientUserId = parseInt(req.params.clientUserId)

    if (isNaN(clientUserId)) return res.status(400).json({ error: "Invalid client id" })

    const relationship = await ClientNutritionistRelationship.findOne({
      where: { nutritionist_user_id: nutritionistId, client_user_id: clientUserId, status: "pending" },
    })

    if (!relationship) return res.status(404).json({ error: "No pending request from this client" })

    relationship.status = "active"
    relationship.start_date = new Date().toISOString().split("T")[0]
    await relationship.save()

    return res.json({ message: "Request approved" })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports.reject_request = async (req, res) => {
  try {
    const nutritionistId = req.user.user_id
    const clientUserId = parseInt(req.params.clientUserId)

    if (isNaN(clientUserId)) return res.status(400).json({ error: "Invalid client id" })

    const relationship = await ClientNutritionistRelationship.findOne({
      where: { nutritionist_user_id: nutritionistId, client_user_id: clientUserId, status: "pending" },
    })

    if (!relationship) return res.status(404).json({ error: "No pending request from this client" })

    await relationship.destroy()

    return res.status(204).send()
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports.assign_meal_plan = async (req, res) => {
  const t = await db.sequelize.transaction()
  try {
    const nutritionistId = req.user.user_id
    const clientUserId = parseInt(req.params.clientUserId)

    if (isNaN(clientUserId)) {
      await t.rollback()
      return res.status(400).json({ error: "Invalid client id" })
    }

    const relationship = await ClientNutritionistRelationship.findOne({
      where: { nutritionist_user_id: nutritionistId, client_user_id: clientUserId, status: "active" },
    })

    if (!relationship) {
      await t.rollback()
      return res.status(403).json({ error: "No active relationship with this client" })
    }

    const { name, start_date, end_date, items } = req.body

    if (!name || !start_date || !items || items.length === 0) {
      await t.rollback()
      return res.status(400).json({ error: "name, start_date and items are required" })
    }

    const mealPlan = await MealPlan.create({
      client_id: clientUserId,
      created_by_user_id: nutritionistId,
      name,
      start_date,
      end_date: end_date || null,
      status: 1,
    }, { transaction: t })

    await MealPlanItem.bulkCreate(
      items.map((item) => ({
        meal_plan_id: mealPlan.meal_plan_id,
        meal_id: item.meal_id,
        day_number: item.day_number,
        meal_time: item.meal_time,
        servings: item.servings || 1,
      })),
      { transaction: t }
    )

    await t.commit()

    return res.status(201).json({ message: "Meal plan assigned successfully", meal_plan_id: mealPlan.meal_plan_id })
  } catch (err) {
    await t.rollback()
    return res.status(500).json({ error: err.message })
  }
}

module.exports.get_client_meal_plans = async (req, res) => {
  try {
    const nutritionistId = req.user.user_id
    const clientUserId = parseInt(req.params.clientUserId)

    if (isNaN(clientUserId)) return res.status(400).json({ error: "Invalid client id" })

    const relationship = await ClientNutritionistRelationship.findOne({
      where: { nutritionist_user_id: nutritionistId, client_user_id: clientUserId, status: "active" },
    })

    if (!relationship) return res.status(403).json({ error: "No active relationship with this client" })

    const plans = await MealPlan.findAll({
      where: { client_id: clientUserId, created_by_user_id: nutritionistId },
      order: [["start_date", "DESC"]],
    })

    return res.json({ totalItems: plans.length, data: plans })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports.get_meals = async (req, res) => {
  try {
    const { search } = req.query
    const where = {}
    if (search) where.name = { [Op.like]: `%${search}%` }

    const meals = await Meal.findAll({ where, order: [["name", "ASC"]] })
    return res.json(meals)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports.create_meal = async (req, res) => {
  try {
    const { name, description, calories_per_serving, protein, carbs, fat } = req.body

    if (!name || !calories_per_serving) {
      return res.status(400).json({ error: "name and calories_per_serving are required" })
    }

    const meal = await Meal.create({
      name,
      description: description || null,
      calories_per_serving,
      protein: protein || null,
      carbs: carbs || null,
      fat: fat || null,
      is_premade: false,
      created_by_user_id: req.user.user_id,
    })

    return res.status(201).json({ message: "Meal created successfully", meal })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
