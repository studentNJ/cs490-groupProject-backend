const { Payment, CoachingPlan, User } = require("../models");
const { Op, fn, col, literal } = require("sequelize");

// GET /api/coach/earnings
const getEarnings = async (req, res) => {
  try {
    const coachId = req.user.user_id;

    const payments = await Payment.findAll({
      where: { coach_id: coachId, payment_status: "completed" },
      include: [
        { model: CoachingPlan, as: "coachingPlan", attributes: ["title"] },
        { model: User, as: "client", attributes: ["first_name", "last_name"] },
      ],
      order: [["created_at", "DESC"]],
    });

    const total = payments.reduce(
      (sum, p) => sum + Number(p.payment_amount),
      0
    );

    const now = new Date();
    const thisMonth = payments.filter((p) => {
      const d = new Date(p.payment_date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });
    const monthTotal = thisMonth.reduce(
      (sum, p) => sum + Number(p.payment_amount),
      0
    );

    const byPlan = {};
    payments.forEach((p) => {
      const title = p.coachingPlan?.title || "Other";
      if (!byPlan[title]) byPlan[title] = 0;
      byPlan[title] += Number(p.payment_amount);
    });

    const monthly = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      monthly[key] = 0;
    }
    payments.forEach((p) => {
      const d = new Date(p.payment_date);
      const key = d.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      if (monthly[key] !== undefined) monthly[key] += Number(p.payment_amount);
    });

    res.json({
      total,
      monthTotal,
      transactionCount: payments.length,
      byPlan: Object.entries(byPlan).map(([title, amount]) => ({
        title,
        amount,
      })),
      monthly: Object.entries(monthly).map(([month, amount]) => ({
        month,
        amount,
      })),
      recentPayments: payments.slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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

module.exports = {
  getMyPlans,
  createPlan,
  updatePlan,
  deactivatePlan,
  getEarnings,
};
