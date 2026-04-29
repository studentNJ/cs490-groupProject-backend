const { Payment, CoachingPlan, User } = require("../models");
const { where } = require("sequelize");
const { stat } = require("fs");
const { profile } = require("console");

// GET /api/client/payments
module.exports.getMyPayments = async (req, res) => {
  try {
    const { CoachingPlan, User } = require("../models");
    const payments = await Payment.findAll({
      where: { client_id: req.user.user_id },
      include: [
        { model: CoachingPlan, as: "coachingPlan", attributes: ["title"] },
        { model: User, as: "coach", attributes: ["first_name", "last_name"] },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
