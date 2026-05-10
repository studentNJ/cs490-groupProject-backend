const {
  SessionBooking,
  SessionPurchase,
  CoachAvailabilityRule,
  User,
  Coach,
} = require("../models");
const { Op } = require("sequelize");
const { createNotification } = require("../services/notificationService");
const { _generateSlots } = require("./availabilityController");

const getActiveRole = (req) => req.headers["x-active-role"] || req.user.role;

// =============================================================
// CLIENT — book a slot
// =============================================================

// POST /api/sessions/bookings
// Body: { coach_user_id, start_time (ISO), client_notes? }
module.exports.book_slot = async (req, res) => {
  const transaction = await SessionBooking.sequelize.transaction();
  try {
    if (getActiveRole(req) !== "client") {
      await transaction.rollback();
      return res.status(403).json({ error: "Clients only" });
    }

    const clientUserId = req.user.user_id;
    const coachUserId = parseInt(req.body.coach_user_id);
    const startTimeStr = req.body.start_time;
    const clientNotes = req.body.client_notes || null;

    if (isNaN(coachUserId)) {
      await transaction.rollback();
      return res.status(400).json({ error: "Valid coach_user_id required" });
    }
    if (!startTimeStr) {
      await transaction.rollback();
      return res.status(400).json({ error: "start_time is required" });
    }

    const startTime = new Date(startTimeStr);
    if (isNaN(startTime.getTime())) {
      await transaction.rollback();
      return res.status(400).json({ error: "Invalid start_time" });
    }

    // Must be in the future (with at least 1 hour buffer)
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    if (startTime < oneHourFromNow) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ error: "Bookings must be made at least 1 hour in advance" });
    }

    // Find an active purchase with credits remaining (FIFO)
    const purchase = await SessionPurchase.findOne({
      where: {
        client_user_id: clientUserId,
        coach_user_id: coachUserId,
        status: "active",
        sessions_remaining: { [Op.gt]: 0 },
      },
      order: [["purchased_at", "ASC"]],
      transaction,
      lock: transaction.LOCK.UPDATE, // prevent race condition
    });

    if (!purchase) {
      await transaction.rollback();
      return res.status(400).json({
        error: "No active sessions remaining. Purchase a package first.",
      });
    }

    // Verify the slot is actually open per the rules + not booked
    // We compute slots ±1 day around the requested time and check
    const fromDate = new Date(startTime);
    fromDate.setDate(fromDate.getDate() - 1);
    const toDate = new Date(startTime);
    toDate.setDate(toDate.getDate() + 1);

    const candidateSlots = await _generateSlots(coachUserId, fromDate, toDate);
    const matchingSlot = candidateSlots.find(
      (s) => new Date(s.start_time).getTime() === startTime.getTime()
    );

    if (!matchingSlot) {
      await transaction.rollback();
      return res.status(409).json({
        error:
          "That slot is no longer available. Please pick a different time.",
      });
    }

    const endTime = new Date(matchingSlot.end_time);
    const durationMinutes = matchingSlot.duration_minutes;

    // Create the booking — UNIQUE(coach, start_time) protects against race
    let booking;
    try {
      booking = await SessionBooking.create(
        {
          purchase_id: purchase.purchase_id,
          rule_id: matchingSlot.rule_id,
          coach_user_id: coachUserId,
          client_user_id: clientUserId,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: durationMinutes,
          status: "confirmed",
          client_notes: clientNotes,
        },
        { transaction }
      );
    } catch (e) {
      // Unique constraint violation = someone else just booked this slot
      if (e.name === "SequelizeUniqueConstraintError") {
        await transaction.rollback();
        return res.status(409).json({
          error: "That slot just got booked. Please pick a different time.",
        });
      }
      throw e;
    }

    // Decrement credits
    purchase.sessions_remaining -= 1;
    if (purchase.sessions_remaining === 0) {
      purchase.status = "exhausted";
    }
    await purchase.save({ transaction });

    await transaction.commit();

    // Notify coach (fire and forget)
    try {
      await createNotification({
        recipient_user_id: coachUserId,
        actor_user_id: clientUserId,
        for_role: "coach",
        type: "session_booked",
        link: `/coach/client/${clientUserId}`,
        related_id: booking.booking_id,
        related_type: "session_booking",
        context: {
          start_time: startTime.toISOString(),
        },
      });
    } catch (e) {
      console.error("Notification (session_booked) failed:", e);
    }

    return res.status(201).json({
      message: "Session booked",
      booking: {
        booking_id: booking.booking_id,
        start_time: booking.start_time,
        end_time: booking.end_time,
        duration_minutes: booking.duration_minutes,
        status: booking.status,
      },
      sessions_remaining: purchase.sessions_remaining,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("book_slot error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// =============================================================
// VIEW BOOKINGS (both client and coach)
// =============================================================

// GET /api/sessions/bookings/upcoming
// Returns the logged-in user's upcoming confirmed bookings
module.exports.list_upcoming_bookings = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const role = getActiveRole(req);

    const where = {
      status: "confirmed",
      start_time: { [Op.gte]: new Date() },
    };
    if (role === "coach") {
      where.coach_user_id = userId;
    } else {
      where.client_user_id = userId;
    }

    const bookings = await SessionBooking.findAll({
      where,
      include: [
        {
          model: User,
          as: "client",
          attributes: ["user_id", "first_name", "last_name", "profile_pic"],
        },
        {
          model: User,
          as: "coach",
          attributes: ["user_id", "first_name", "last_name", "profile_pic"],
        },
      ],
      order: [["start_time", "ASC"]],
    });

    return res.json({ bookings });
  } catch (err) {
    console.error("list_upcoming_bookings error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/sessions/bookings/past
// Returns completed/cancelled bookings, paginated
module.exports.list_past_bookings = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const role = getActiveRole(req);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);

    const where = {
      [Op.or]: [
        { status: "completed" },
        { status: "cancelled" },
        { status: "no_show" },
        {
          status: "confirmed",
          start_time: { [Op.lt]: new Date() },
        },
      ],
    };
    if (role === "coach") {
      where.coach_user_id = userId;
    } else {
      where.client_user_id = userId;
    }

    const bookings = await SessionBooking.findAll({
      where,
      include: [
        {
          model: User,
          as: "client",
          attributes: ["user_id", "first_name", "last_name", "profile_pic"],
        },
        {
          model: User,
          as: "coach",
          attributes: ["user_id", "first_name", "last_name", "profile_pic"],
        },
      ],
      order: [["start_time", "DESC"]],
      limit,
    });

    return res.json({ bookings });
  } catch (err) {
    console.error("list_past_bookings error:", err);
    return res.status(500).json({ error: err.message });
  }
};
