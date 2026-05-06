const { CoachAvailabilityRule, SessionBooking, User } = require("../models");
const { Op } = require("sequelize");

const getActiveRole = (req) => req.headers["x-active-role"] || req.user.role;

// =============================================================
// COACH SIDE
// =============================================================

// GET /api/coach/availability — list current coach's rules
module.exports.list_my_rules = async (req, res) => {
  try {
    if (getActiveRole(req) !== "coach") {
      return res.status(403).json({ error: "Coaches only" });
    }

    const rules = await CoachAvailabilityRule.findAll({
      where: { coach_user_id: req.user.user_id },
      order: [
        ["day_of_week", "ASC"],
        ["start_time", "ASC"],
      ],
    });

    return res.json({ rules });
  } catch (err) {
    console.error("list_my_rules error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/coach/availability — create a rule
module.exports.create_rule = async (req, res) => {
  try {
    if (getActiveRole(req) !== "coach") {
      return res.status(403).json({ error: "Coaches only" });
    }

    const coachUserId = req.user.user_id;
    const { day_of_week, start_time, end_time, duration_minutes } = req.body;

    // Validate day_of_week
    const day = parseInt(day_of_week);
    if (isNaN(day) || day < 0 || day > 6) {
      return res
        .status(400)
        .json({ error: "day_of_week must be 0 (Sun) through 6 (Sat)" });
    }

    // Validate time format HH:MM (with optional :SS)
    const timeRe = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
    if (!start_time || !timeRe.test(start_time)) {
      return res
        .status(400)
        .json({ error: "start_time must be HH:MM (24-hour format)" });
    }
    if (!end_time || !timeRe.test(end_time)) {
      return res
        .status(400)
        .json({ error: "end_time must be HH:MM (24-hour format)" });
    }

    // Normalize to HH:MM:SS for MySQL TIME column
    const normTime = (t) => (t.length === 5 ? `${t}:00` : t);
    const startNorm = normTime(start_time);
    const endNorm = normTime(end_time);

    if (endNorm <= startNorm) {
      return res
        .status(400)
        .json({ error: "end_time must be later than start_time" });
    }

    // Validate duration
    const duration = parseInt(duration_minutes) || 60;
    if (duration < 15 || duration > 240) {
      return res
        .status(400)
        .json({ error: "duration_minutes must be between 15 and 240" });
    }

    // Window must fit at least one full duration
    const [sh, sm] = startNorm.split(":").map(Number);
    const [eh, em] = endNorm.split(":").map(Number);
    const windowMinutes = eh * 60 + em - (sh * 60 + sm);
    if (windowMinutes < duration) {
      return res.status(400).json({
        error: `Time window (${windowMinutes} min) is shorter than session duration (${duration} min)`,
      });
    }

    const rule = await CoachAvailabilityRule.create({
      coach_user_id: coachUserId,
      day_of_week: day,
      start_time: startNorm,
      end_time: endNorm,
      duration_minutes: duration,
      is_active: true,
    });

    return res.status(201).json({ rule });
  } catch (err) {
    console.error("create_rule error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// DELETE /api/coach/availability/:ruleId — delete a rule
// (we hard-delete; future bookings keep their rule_id=NULL via FK SET NULL)
module.exports.delete_rule = async (req, res) => {
  try {
    if (getActiveRole(req) !== "coach") {
      return res.status(403).json({ error: "Coaches only" });
    }

    const coachUserId = req.user.user_id;
    const ruleId = parseInt(req.params.ruleId);
    if (isNaN(ruleId)) {
      return res.status(400).json({ error: "Invalid rule id" });
    }

    const deleted = await CoachAvailabilityRule.destroy({
      where: { rule_id: ruleId, coach_user_id: coachUserId },
    });

    if (!deleted) {
      return res.status(404).json({ error: "Rule not found" });
    }

    return res.json({ message: "Rule deleted" });
  } catch (err) {
    console.error("delete_rule error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Helper: generate virtual slots for a coach over a date range
async function generateSlots(coachUserId, fromDate, toDate) {
  const rules = await CoachAvailabilityRule.findAll({
    where: { coach_user_id: coachUserId, is_active: true },
  });

  if (rules.length === 0) return [];

  const existingBookings = await SessionBooking.findAll({
    where: {
      coach_user_id: coachUserId,
      status: { [Op.in]: ["confirmed", "completed"] },
      start_time: { [Op.between]: [fromDate, toDate] },
    },
    attributes: ["start_time"],
  });

  const bookedSet = new Set(
    existingBookings.map((b) => new Date(b.start_time).getTime())
  );

  const slots = [];
  const now = new Date();

  // Iterate one day at a time
  const dayCursor = new Date(fromDate);
  dayCursor.setHours(0, 0, 0, 0);
  const endCursor = new Date(toDate);
  endCursor.setHours(23, 59, 59, 999);

  while (dayCursor <= endCursor) {
    const dow = dayCursor.getDay();
    const matchingRules = rules.filter((r) => r.day_of_week === dow);

    for (const rule of matchingRules) {
      const [sh, sm] = rule.start_time.split(":").map(Number);
      const [eh, em] = rule.end_time.split(":").map(Number);
      const ruleStartMin = sh * 60 + sm;
      const ruleEndMin = eh * 60 + em;
      const dur = rule.duration_minutes;

      for (
        let slotStartMin = ruleStartMin;
        slotStartMin + dur <= ruleEndMin;
        slotStartMin += dur
      ) {
        // Build slot Date by cloning the day, then explicitly setting H/M
        const slotStart = new Date(
          dayCursor.getFullYear(),
          dayCursor.getMonth(),
          dayCursor.getDate(),
          Math.floor(slotStartMin / 60),
          slotStartMin % 60,
          0,
          0
        );

        if (slotStart <= now) continue;
        if (bookedSet.has(slotStart.getTime())) continue;

        const slotEnd = new Date(slotStart.getTime() + dur * 60000);

        slots.push({
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
          duration_minutes: dur,
          rule_id: rule.rule_id,
          day_of_week: dow,
        });
      }
    }

    dayCursor.setDate(dayCursor.getDate() + 1);
  }

  slots.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  return slots;
}
// GET /api/coaches/:coachUserId/availability — public, list open future slots
// Query: ?weeks=8 (how far ahead to look, default 8, max 12)
module.exports.list_coach_slots_public = async (req, res) => {
  try {
    const coachUserId = parseInt(req.params.coachUserId);
    if (isNaN(coachUserId)) {
      return res.status(400).json({ error: "Invalid coach id" });
    }

    const weeks = Math.min(12, Math.max(1, parseInt(req.query.weeks) || 8));

    const fromDate = new Date();
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + weeks * 7);

    const slots = await generateSlots(coachUserId, fromDate, toDate);
    return res.json({ slots, weeks });
  } catch (err) {
    console.error("list_coach_slots_public error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/coach/availability/slots — coach's own view of their generated slots
// Useful for the coach's calendar to show "what would clients see"
module.exports.list_my_slots = async (req, res) => {
  try {
    if (getActiveRole(req) !== "coach") {
      return res.status(403).json({ error: "Coaches only" });
    }

    const weeks = Math.min(12, Math.max(1, parseInt(req.query.weeks) || 8));
    const fromDate = new Date();
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + weeks * 7);

    const slots = await generateSlots(req.user.user_id, fromDate, toDate);
    return res.json({ slots, weeks });
  } catch (err) {
    console.error("list_my_slots error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Export helper for use by other controllers (booking)
module.exports._generateSlots = generateSlots;
