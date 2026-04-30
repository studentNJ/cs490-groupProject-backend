const db = require("../models");
const { Op } = require("sequelize")
const Meal = db.Meal;
const MealPlan = db.MealPlan;
const MealPlanItem = db.MealPlanItem
const User = db.User;
const Client = db.Client;
const Nutritionist = db.Nutritionist;
const MealLog = db.MealLog;

module.exports.get_meals = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const { search, type } = req.query;

    let where = {
      [Op.or]: [
        { is_premade: true },
        { created_by_user_id: user_id }
      ]
    };

    if (search) {
      where.name = {
        [Op.like]: `%${search}%`
      };
    }

    if (type === "premade") {
      where = { is_premade: true };
    }

    if (type === "custom") {
      where = { created_by_user_id: user_id };
    }

    const meals = await Meal.findAll({
      where,
      order: [["name", "ASC"]]
    });

    res.json(meals);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch meals" });
  }
};

module.exports.create_meal_plan = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const created_by_user_id = req.user.user_id;

    const {
      client_id,
      name,
      start_date,
      end_date,
      items
    } = req.body;

    if (!client_id || !name || !start_date) {
      await t.rollback();
      return res.status(400).json({
        error: "client_id, name, and start_date are required"
      });
    }

    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({
        error: "Meal plan must include at least one item"
      });
    }

    const mealPlan = await MealPlan.create({
      client_id,
      created_by_user_id,
      name,
      start_date,
      end_date,
      status: 1
    }, { transaction: t });

    const mealIds = items.map(i => i.meal_id);

    const meals = await Meal.findAll({
      where: { id: mealIds }
    });

    if (meals.length !== mealIds.length) {
      await t.rollback();
      return res.status(400).json({
        error: "One or more meals are invalid"
      });
    }

    const formattedItems = items.map(item => ({
      meal_plan_id: mealPlan.meal_plan_id,
      meal_id: item.meal_id,
      day_number: item.day_number,
      meal_time: item.meal_time,
      servings: item.servings || 1
    }));

    await MealPlanItem.bulkCreate(formattedItems, {
      transaction: t
    });

    await t.commit();

    res.status(201).json({
      message: "Meal plan created successfully",
      mealPlanId: mealPlan.meal_plan_id
    });

  } catch (err) {
    await t.rollback();
    console.error(err);

    res.status(500).json({
      error: "Failed to create meal plan"
    });
  }
};

module.exports.get_meal_plan = async (req, res) => {
  try {
    const plan = await MealPlan.findByPk(req.params.id, {
      include: [
        {
          model: MealPlanItem,
          as: "items",
          include: [
            {
              model: Meal,
              as: "meal"
            }
          ]
        }
      ]
    });

    if (!plan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    if (
      plan.created_by_user_id !== req.user.user_id &&
      plan.client_id !== req.user.user_id
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const grouped = {};

    plan.items.forEach(item => {
      const day = item.day_number;

      if (!grouped[day]) {
        grouped[day] = {};
      }

      grouped[day][item.meal_time] = {
        meal_id: item.meal_id,
        name: item.meal.name,
        calories_per_serving: item.meal.calories_per_serving,
        servings: item.servings
      };
    });

    res.json({
      meal_plan_id: plan.meal_plan_id,
      name: plan.name,
      start_date: plan.start_date,
      end_date: plan.end_date,
      days: grouped
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch meal plan" });
  }
};

module.exports.browse_meal_plans = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const plans = await MealPlan.findAll({
      where: {
        [Op.or]: [
          { created_by_user_id: user_id },
          { client_id: user_id }
        ]
      },
    });

    res.json(plans);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch meal plans" });
  }
};

module.exports.log_meal_plan = async (req, res) => {
  try {
    const { mealPlanId } = req.params;
    const { day } = req.query;
    const user_id = req.user.user_id;

    const plan = await MealPlan.findByPk(mealPlanId, {
      include: [{
        model: MealPlanItem,
        as: "items",
        include: [{ model: Meal, as: "meal" }]
      }]
    });

    if (!plan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    if (plan.client_id !== user_id) {
      return res.status(403).json({ error: "Not your meal plan" });
    }

    const items = plan.items.filter(i => i.day_number == day);

    if (items.length === 0) {
      return res.status(404).json({ error: "No meals for this day" });
    }

    const logs = items.map(item => ({
      user_id,
      meal_id: item.meal_id,
      date: new Date().toISOString().split("T")[0],
      servings: item.servings,
      calories_consumed: item.meal.calories_per_serving * item.servings
    }));

    const created = await MealLog.bulkCreate(logs);

    res.status(201).json({
      message: "Meal logs created from plan",
      logs: created
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create logs" });
  }
};

module.exports.delete_meal_plan = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    const plan = await MealPlan.findByPk(id);

    if (!plan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    if (plan.created_by_user_id !== user_id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await plan.destroy();

    res.json({ message: "Meal plan deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete meal plan" });
  }
};