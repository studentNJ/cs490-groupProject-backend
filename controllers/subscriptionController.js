const { v4: uuidv4 } = require("uuid");
const {
  sequelize,
  CoachingPlan,
  Payment,
  Subscription,
  ClientCoachRelationship,
} = require("../models");

// GET /api/coaches/:userId/plans  (public)
const getCoachPlans = async (req, res) => {
  try {
    const plans = await CoachingPlan.findAll({
      where: { coach_id: req.params.userId, is_active: true },
      order: [["price", "ASC"]],
    });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/subscriptions
const subscribe = async (req, res) => {
  const clientId = req.user.user_id;
  const { coaching_plan_id } = req.body;

  if (!coaching_plan_id) {
    return res.status(400).json({ error: "coaching_plan_id is required." });
  }

  // Verify plan exists and is active
  const plan = await CoachingPlan.findOne({
    where: { plan_id: coaching_plan_id, is_active: true },
  });

  if (!plan) {
    return res
      .status(404)
      .json({ error: "Plan not found or no longer available." });
  }

  // Calculate dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.plan_duration);

  const toDateOnly = (d) => d.toISOString().split("T")[0];

  try {
    const result = await sequelize.transaction(async (t) => {
      // 1. Insert payment
      const payment = await Payment.create(
        {
          client_id: clientId,
          coach_id: plan.coach_id,
          coaching_plan_id: plan.plan_id,
          transaction_id: uuidv4(),
          payment_method: "card",
          payment_amount: plan.price,
          payment_date: new Date(),
          payment_status: "completed",
          currency: plan.currency,
        },
        { transaction: t }
      );

      // 2. Insert subscription
      const subscription = await Subscription.create(
        {
          client_id: clientId,
          coach_id: plan.coach_id,
          coaching_plan_id: plan.plan_id,
          payment_id: payment.payment_id,
          start_date: toDateOnly(startDate),
          end_date: toDateOnly(endDate),
          status: "active",
        },
        { transaction: t }
      );

      // 3. Upsert client_coach_relationship
      const [relationship] = await ClientCoachRelationship.findOrCreate({
        where: {
          client_user_id: clientId,
          coach_user_id: plan.coach_id,
        },
        defaults: {
          status: "active",
          responded_at: new Date(),
        },
        transaction: t,
      });

      if (relationship.status !== "active") {
        await relationship.update(
          {
            status: "active",
            responded_at: new Date(),
          },
          { transaction: t }
        );
      }

      return { payment, subscription };
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/client/subscription  — active sub for dashboard card
const getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { client_id: req.user.user_id, status: "active" },
      include: [
        {
          model: CoachingPlan,
          as: "coachingPlan",
          attributes: ["title", "plan_duration"],
        },
        {
          model: require("../models").User,
          as: "coach",
          attributes: ["user_id", "first_name", "last_name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    if (!subscription) return res.json(null);
    res.json(subscription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/subscriptions/:id/cancel
const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { subscription_id: req.params.id, client_id: req.user.user_id },
    });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found." });
    }
    if (subscription.status === "cancelled") {
      return res
        .status(400)
        .json({ error: "Subscription is already cancelled." });
    }

    await subscription.update({
      status: "cancelled",
      cancelled_at: new Date(),
    });

    res.json({
      message: "Subscription cancelled. Access continues until end date.",
      subscription,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getCoachPlans,
  subscribe,
  getMySubscription,
  cancelSubscription,
};
