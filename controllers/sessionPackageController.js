const { SessionPackage, Coach, User } = require("../models");

const getActiveRole = (req) => req.headers["x-active-role"] || req.user.role;

// GET /api/coach/packages — list current coach's packages
module.exports.list_my_packages = async (req, res) => {
  try {
    if (getActiveRole(req) !== "coach") {
      return res.status(403).json({ error: "Coaches only" });
    }

    const packages = await SessionPackage.findAll({
      where: { coach_user_id: req.user.user_id },
      order: [
        ["is_active", "DESC"],
        ["session_count", "ASC"],
      ],
    });

    return res.json({ packages });
  } catch (err) {
    console.error("list_my_packages error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/coach/packages — create
module.exports.create_package = async (req, res) => {
  try {
    if (getActiveRole(req) !== "coach") {
      return res.status(403).json({ error: "Coaches only" });
    }

    const coachUserId = req.user.user_id;
    const { name, session_count, discount_percent } = req.body;

    // Validate
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Package name is required" });
    }
    if (name.length > 100) {
      return res
        .status(400)
        .json({ error: "Package name must be 100 characters or fewer" });
    }
    const sessionCount = parseInt(session_count);
    if (isNaN(sessionCount) || sessionCount < 1) {
      return res
        .status(400)
        .json({ error: "session_count must be at least 1" });
    }
    const discount = parseFloat(discount_percent || 0);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      return res
        .status(400)
        .json({ error: "discount_percent must be between 0 and 100" });
    }

    // Coach must have set their hourly rate before creating packages
    const coach = await Coach.findOne({ where: { user_id: coachUserId } });
    if (!coach) {
      return res.status(404).json({ error: "Coach profile not found" });
    }
    if (coach.price === null || coach.price === undefined) {
      return res.status(400).json({
        error: "Set your hourly rate on your profile before creating packages",
      });
    }

    const pkg = await SessionPackage.create({
      coach_user_id: coachUserId,
      name: name.trim(),
      session_count: sessionCount,
      discount_percent: discount,
      is_active: true,
    });

    return res.status(201).json({ package: pkg });
  } catch (err) {
    console.error("create_package error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// PATCH /api/coach/packages/:packageId — update
module.exports.update_package = async (req, res) => {
  try {
    if (getActiveRole(req) !== "coach") {
      return res.status(403).json({ error: "Coaches only" });
    }

    const coachUserId = req.user.user_id;
    const packageId = parseInt(req.params.packageId);
    if (isNaN(packageId)) {
      return res.status(400).json({ error: "Invalid package id" });
    }

    const pkg = await SessionPackage.findOne({
      where: { package_id: packageId, coach_user_id: coachUserId },
    });
    if (!pkg) {
      return res.status(404).json({ error: "Package not found" });
    }

    const { name, session_count, discount_percent, is_active } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Invalid name" });
      }
      if (name.length > 100) {
        return res.status(400).json({ error: "Name too long" });
      }
      pkg.name = name.trim();
    }
    if (session_count !== undefined) {
      const c = parseInt(session_count);
      if (isNaN(c) || c < 1) {
        return res.status(400).json({ error: "Invalid session_count" });
      }
      pkg.session_count = c;
    }
    if (discount_percent !== undefined) {
      const d = parseFloat(discount_percent);
      if (isNaN(d) || d < 0 || d > 100) {
        return res
          .status(400)
          .json({ error: "discount_percent must be between 0 and 100" });
      }
      pkg.discount_percent = d;
    }
    if (is_active !== undefined) {
      pkg.is_active = !!is_active;
    }

    await pkg.save();
    return res.json({ package: pkg });
  } catch (err) {
    console.error("update_package error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// DELETE /api/coach/packages/:packageId — soft delete (set inactive)
module.exports.deactivate_package = async (req, res) => {
  try {
    if (getActiveRole(req) !== "coach") {
      return res.status(403).json({ error: "Coaches only" });
    }

    const coachUserId = req.user.user_id;
    const packageId = parseInt(req.params.packageId);
    if (isNaN(packageId)) {
      return res.status(400).json({ error: "Invalid package id" });
    }

    const pkg = await SessionPackage.findOne({
      where: { package_id: packageId, coach_user_id: coachUserId },
    });
    if (!pkg) {
      return res.status(404).json({ error: "Package not found" });
    }

    pkg.is_active = false;
    await pkg.save();

    return res.json({ message: "Package deactivated", package: pkg });
  } catch (err) {
    console.error("deactivate_package error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/coaches/:coachUserId/packages — public, lists active packages with computed prices
module.exports.list_coach_packages_public = async (req, res) => {
  try {
    const coachUserId = parseInt(req.params.coachUserId);
    if (isNaN(coachUserId)) {
      return res.status(400).json({ error: "Invalid coach id" });
    }

    const coach = await Coach.findOne({ where: { user_id: coachUserId } });
    if (!coach) {
      return res.status(404).json({ error: "Coach not found" });
    }

    const packages = await SessionPackage.findAll({
      where: { coach_user_id: coachUserId, is_active: true },
      order: [["session_count", "ASC"]],
    });

    // Compute prices
    const hourlyRate = coach.price ? parseFloat(coach.price) : null;
    const enriched = packages.map((p) => {
      const baseTotal = hourlyRate ? hourlyRate * p.session_count : null;
      const finalPrice = baseTotal
        ? baseTotal * (1 - parseFloat(p.discount_percent) / 100)
        : null;

      return {
        package_id: p.package_id,
        coach_user_id: p.coach_user_id,
        name: p.name,
        session_count: p.session_count,
        discount_percent: parseFloat(p.discount_percent),
        hourly_rate: hourlyRate,
        base_total: baseTotal,
        final_price: finalPrice,
        is_active: p.is_active,
      };
    });

    return res.json({ packages: enriched, hourly_rate: hourlyRate });
  } catch (err) {
    console.error("list_coach_packages_public error:", err);
    return res.status(500).json({ error: err.message });
  }
};
