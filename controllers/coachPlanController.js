const { CoachingPlan } = require("../models");

// GET /api/coach/plans
const getMyPlans = async (req, res) => {
  try {
    const plans = await CoachingPlan.findAll({
      where: { coach_id: req.user.user_id },
      order: [["created_at", "DESC"]],
    });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/coach/plans
const createPlan = async (req, res) => {
  try {
    const { title, plan_duration, price, currency, description } = req.body;

    if (!title || !plan_duration || !price) {
      return res
        .status(400)
        .json({ error: "title, plan_duration, and price are required." });
    }

    const plan = await CoachingPlan.create({
      coach_id: req.user.user_id,
      title,
      plan_duration,
      price,
      currency: currency || "USD",
      description: description || null,
      is_active: true,
    });

    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/coach/plans/:planId
const updatePlan = async (req, res) => {
  try {
    const plan = await CoachingPlan.findOne({
      where: { plan_id: req.params.planId, coach_id: req.user.user_id },
    });

    if (!plan) {
      return res
        .status(404)
        .json({ error: "Plan not found or you don't own it." });
    }

    const { title, plan_duration, price, currency, description, is_active } =
      req.body;

    await plan.update({
      ...(title !== undefined && { title }),
      ...(plan_duration !== undefined && { plan_duration }),
      ...(price !== undefined && { price }),
      ...(currency !== undefined && { currency }),
      ...(description !== undefined && { description }),
      ...(is_active !== undefined && { is_active }),
    });

    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/coach/plans/:planId  (soft delete)
const deactivatePlan = async (req, res) => {
  try {
    const plan = await CoachingPlan.findOne({
      where: { plan_id: req.params.planId, coach_id: req.user.user_id },
    });

    if (!plan) {
      return res
        .status(404)
        .json({ error: "Plan not found or you don't own it." });
    }

    await plan.update({ is_active: false });
    res.json({ message: "Plan deactivated.", plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMyPlans, createPlan, updatePlan, deactivatePlan };
