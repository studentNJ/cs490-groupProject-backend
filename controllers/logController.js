const db = require("../models");
const { Op } = require("sequelize");
const Exercise = db.Exercise;
const Workout = db.Workout;
const workoutExercise = db.workoutExercise;
const WorkoutLog = db.WorkoutLog;
const CardioLogDetail = db.CardioLogDetail;
const StrengthLogDetail = db.StrengthLogDetail;
const WellnessLogs = db.WellnessLogs;

module.exports.workout_logs = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // search by date
    const { start, end } = req.query;

    //pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const dateFilter = {};
    if (start && end) {
      dateFilter[Op.between] = [new Date(start), new Date(end)];
    } else if (start) {
      dateFilter[Op.gte] = new Date(start);
    } else if (end) {
      dateFilter[Op.lte] = new Date(end);
    }

    const workouts = await WorkoutLog.findAndCountAll({
      where: {
        client_id: userId,
        ...(Object.keys(dateFilter).length && { date: dateFilter }),
      },
      order: [["date", "DESC"]],
      include: [
        {
          model: StrengthLogDetail,
          as: "strengthLogs",
          include: ["exercise"],
        },
        {
          model: CardioLogDetail,
          as: "cardioLogs",
          include: ["exercise"],
        },
      ],
      limit,
      offset,
    });

    const totalPages = Math.max(1, Math.ceil(workouts.count / limit));

    res.json({
      totalItems: workouts.count,
      totalPages,
      currentPage: page,
      data: workouts.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.create_workout_log = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const userId = req.user.user_id;

    const {
      workout_id,
      date,
      notes,
      strengthLogs = [],
      cardioLogs = [],
    } = req.body;

    if (!date) {
      await t.rollback();
      return res.status(400).json({ error: "Date is required" });
    }

    const workout = await Workout.findOne({
      where: {
        workout_id: workout_id,
      },
    });

    if (!workout) {
      await t.rollback();
      return res.status(404).json({ error: "workout not found" });
    }

    const workoutLog = await WorkoutLog.create(
      {
        client_id: userId,
        workout_id,
        date,
        notes: notes || null,
      },
      { transaction: t }
    );

    const workoutLogId = workoutLog.workout_log_id;

    if (strengthLogs.length > 0) {
      const strengthData = strengthLogs.map((log) => ({
        workout_log_id: workoutLogId,
        exercise_id: log.exercise_id,
        sets: log.sets,
        reps: log.reps,
        weight_lbs: log.weight_lbs ?? null,
        duration: log.duration || null,
        notes: log.notes || null,
      }));

      await StrengthLogDetail.bulkCreate(strengthData, { transaction: t });
    }

    if (cardioLogs.length > 0) {
      const cardioData = cardioLogs.map((log) => ({
        workout_log_id: workoutLogId,
        exercise_id: log.exercise_id,
        duration_minutes: log.duration_minutes ?? null,
        distance_km: log.distance_km || null,
        avg_herat_rate: log.avg_herat_rate ?? null,
        notes: log.notes || null,
      }));

      await CardioLogDetail.bulkCreate(cardioData, { transaction: t });
    }

    await t.commit();

    res.status(201).json({
      message: "Workout Log created successfully",
      workoutLogId,
    });
  } catch (err) {
    await t.rollback();
    console.error("create_workout_log error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports.wellness_logs = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // search by date
    const { start, end } = req.query;

    //pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const dateFilter = {};
    if (start && end) {
      dateFilter[Op.between] = [new Date(start), new Date(end)];
    } else if (start) {
      dateFilter[Op.gte] = new Date(start);
    } else if (end) {
      dateFilter[Op.lte] = new Date(end);
    }

    const logs = await WellnessLogs.findAndCountAll({
      where: {
        ...(Object.keys(dateFilter).length && { date: dateFilter }),
      },
      include: [
        {
          model: Client,
          as: "client",
          required: true,
          where: {
            user_id: userId,
          },
          attributes: [],
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
      distinct: true,
      col: "wl_id",
    });

    const totalPages = Math.max(1, Math.ceil(logs.count / limit));

    return res.json({
      totalItems: logs.count, // Total # of Exercises
      totalPages, // Total # of pages too hold all exercises
      currentPage: page, // Current page
      data: logs.rows, // Next 10 (or whatever limit is) exercises
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.create_wellness_log = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const userId = req.user.user_id;

    const { date, weight, water_intake_oz, notes } = req.body;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const client = await Client.findOne({
      where: { user_id: userId },
    });

    if (!client) {
      return res
        .status(403)
        .json({ error: "Only clients can log wellness data" });
    }

    const existingLog = await WellnessLogs.findOne({
      where: {
        client_id: userId,
        date: new Date(date),
      },
    });

    if (existingLog) {
      return res
        .status(400)
        .json({ error: "Log already exists for this date" });
    }

    const log = await WellnessLogs.create(
      {
        user_id: userId,
        date,
        weight,
        water_intake_oz,
        notes,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json(log);
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};

module.exports.edit_wellness_log = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const logId = req.params.id;

    const log = await WellnessLogs.findByPk(logId, {
      include: [
        {
          model: Client,
          as: "client",
          required: true,
          where: { user_id: userId },
          attributes: [],
        },
      ],
    });

    if (!log) {
      return res.status(404).json({ error: "Log not found" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const logDate = new Date(log.date).toISOString().slice(0, 10);

    if (today !== logDate) {
      return res.status(403).json({ error: "Only same-day logs are editable" });
    }

    const { weight, water_intake_oz, notes } = req.body;

    await log.update({
      weight,
      water_intake_oz,
      notes,
    });

    return res.json(log);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports.delete_wellness_log = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const userId = req.user.user_id;
    const logId = req.params.id;

    const log = await WellnessLogs.findOne({
      where: {
        user_id: userId,
        wl_id: logId,
      },
    });

    if (!log) {
      await t.rollback();
      return res.status(404).json({ error: "Log not found " });
    }

    const today = new Date().toISOString().slice(0, 10);
    const logDate = new Date(log.date).toISOString.slice(0, 10);

    if (today !== logDate) {
      return res
        .status(403)
        .json({ error: "Only same-day logs may be deleted" });
    }

    await log.destroy({
      where: { wl_id: logId },
      transaction: t,
    });

    await t.commit();
    return res.json({ message: "Wellness Log deleted successfully" });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ err: message });
  }
};
