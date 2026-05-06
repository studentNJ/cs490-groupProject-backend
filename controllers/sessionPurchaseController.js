const {
  SessionPackage,
  SessionPurchase,
  Coach,
  ClientCoachRelationship,
  Payment,
  User,
} = require("../models");
const { createNotification } = require("../services/notificationService");

const getActiveRole = (req) => req.headers["x-active-role"] || req.user.role;

const generateTransactionId = () => {
  const random = Math.random().toString(36).slice(2, 10);
  return `txn_${Date.now()}_${random}`;
};

// POST /api/sessions/purchase
// Body: { package_id }
module.exports.purchase_package = async (req, res) => {
  const transaction = await SessionPurchase.sequelize.transaction();
  try {
    if (getActiveRole(req) !== "client") {
      await transaction.rollback();
      return res.status(403).json({ error: "Clients only" });
    }

    const clientUserId = req.user.user_id;
    const packageId = parseInt(req.body.package_id);

    if (isNaN(packageId)) {
      await transaction.rollback();
      return res.status(400).json({ error: "Valid package_id required" });
    }

    // Load the package
    const pkg = await SessionPackage.findOne({
      where: { package_id: packageId, is_active: true },
      transaction,
    });

    if (!pkg) {
      await transaction.rollback();
      return res.status(404).json({ error: "Package not found or inactive" });
    }

    const coachUserId = pkg.coach_user_id;

    if (coachUserId === clientUserId) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ error: "You cannot subscribe to your own package" });
    }

    // Get coach's hourly rate to calculate price
    const coach = await Coach.findByPk(coachUserId, { transaction });
    if (!coach) {
      await transaction.rollback();
      return res.status(404).json({ error: "Coach not found" });
    }
    if (coach.price === null || coach.price === undefined) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ error: "Coach has not set their hourly rate" });
    }

    // Calculate the price
    const hourlyRate = parseFloat(coach.price);
    const baseTotal = hourlyRate * pkg.session_count;
    const discount = parseFloat(pkg.discount_percent) / 100;
    const finalPrice = baseTotal * (1 - discount);
    const totalPrice = parseFloat(finalPrice.toFixed(2));

    // Create the payment record (mock — we don't actually charge)
    const payment = await Payment.create(
      {
        client_id: clientUserId,
        coach_id: coachUserId,
        package_id: packageId,
        transaction_id: generateTransactionId(),
        payment_method: "card",
        payment_amount: totalPrice,
        payment_date: new Date(),
        payment_status: "completed",
        currency: "USD",
      },
      { transaction }
    );

    // Activate or create the client-coach relationship
    let relationship = await ClientCoachRelationship.findOne({
      where: {
        client_user_id: clientUserId,
        coach_user_id: coachUserId,
      },
      transaction,
    });

    if (relationship) {
      // Reactivate if it was inactive/rejected/pending
      if (relationship.status !== "active") {
        relationship.status = "active";
        relationship.responded_at = new Date();
        relationship.end_date = null;
        await relationship.save({ transaction });
      }
    } else {
      relationship = await ClientCoachRelationship.create(
        {
          client_user_id: clientUserId,
          coach_user_id: coachUserId,
          status: "active",
          requested_at: new Date(),
          responded_at: new Date(),
        },
        { transaction }
      );
    }

    // Create the purchase record
    const purchase = await SessionPurchase.create(
      {
        client_user_id: clientUserId,
        coach_user_id: coachUserId,
        package_id: packageId,
        payment_id: payment.payment_id,
        total_sessions: pkg.session_count,
        sessions_remaining: pkg.session_count,
        total_price_snapshot: totalPrice,
        status: "active",
      },
      { transaction }
    );

    await transaction.commit();

    // Notify the coach (fire and forget)
    try {
      await createNotification({
        recipient_user_id: coachUserId,
        actor_user_id: clientUserId,
        for_role: "coach",
        type: "session_package_purchased",
        link: `/coach/client/${clientUserId}`,
        related_id: purchase.purchase_id,
        related_type: "session_purchase",
        context: {
          package_name: pkg.name,
          session_count: pkg.session_count,
        },
      });
    } catch (e) {
      console.error("Notification (session_package_purchased) failed:", e);
    }

    return res.status(201).json({
      message: "Package purchased successfully",
      purchase: {
        purchase_id: purchase.purchase_id,
        package_name: pkg.name,
        total_sessions: purchase.total_sessions,
        sessions_remaining: purchase.sessions_remaining,
        total_price: totalPrice,
        coach_user_id: coachUserId,
      },
      payment: {
        payment_id: payment.payment_id,
        amount: totalPrice,
        transaction_id: payment.transaction_id,
      },
      relationship_id: relationship.relationship_id,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("purchase_package error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/sessions/purchases — client's own purchases
module.exports.list_my_purchases = async (req, res) => {
  try {
    if (getActiveRole(req) !== "client") {
      return res.status(403).json({ error: "Clients only" });
    }

    const purchases = await SessionPurchase.findAll({
      where: { client_user_id: req.user.user_id },
      include: [
        {
          model: SessionPackage,
          attributes: ["name", "session_count", "discount_percent"],
        },
        {
          model: User,
          as: "coach",
          attributes: ["user_id", "first_name", "last_name", "profile_pic"],
        },
      ],
      order: [["purchased_at", "DESC"]],
    });

    return res.json({ purchases });
  } catch (err) {
    console.error("list_my_purchases error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/sessions/purchases/active-with/:coachUserId
// — does this client have active credits with this coach?
module.exports.active_purchase_with_coach = async (req, res) => {
  try {
    if (getActiveRole(req) !== "client") {
      return res.status(403).json({ error: "Clients only" });
    }

    const coachUserId = parseInt(req.params.coachUserId);
    if (isNaN(coachUserId)) {
      return res.status(400).json({ error: "Invalid coach id" });
    }

    const purchase = await SessionPurchase.findOne({
      where: {
        client_user_id: req.user.user_id,
        coach_user_id: coachUserId,
        status: "active",
        sessions_remaining: { [require("sequelize").Op.gt]: 0 },
      },
      order: [["purchased_at", "ASC"]], // oldest active first (FIFO)
    });

    return res.json({ purchase });
  } catch (err) {
    console.error("active_purchase_with_coach error:", err);
    return res.status(500).json({ error: err.message });
  }
};
