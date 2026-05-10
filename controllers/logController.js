const db = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const Exercise = db.Exercise;  
const Workout = db.Workout; 
const workoutExercise = db.workoutExercise;
const WorkoutLog = db.WorkoutLog;
const CardioLogDetail = db.CardioLogDetail;
const StrengthLogDetail = db.StrengthLogDetail;
const WellnessLogs = db.WellnessLogs;
const Meal = db.Meal;
const MealLog = db.MealLog;
const DailyCheckin = db.DailyCheckin;
const Client = db.Client;

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
      duration_minutes,
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
        duration_minutes: duration_minutes ?? null,
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

        const {
            date,
            water_intake_oz,
            notes,
            steps,
            sleep_hours
        } = req.body;

        if(!date) {
            return res.status(400).json({ error: "Date is required"})
        };

        const client = await Client.findOne({
            where: { user_id: userId}
        });

        if (!client) {
            return res.status(403).json({ error: "Only clients can log wellness data" });
        }

        const existingLog = await WellnessLogs.findOne({
            where : {
                user_id: userId,
                date
            }
        });

        if (existingLog) {
            return res.status(400).json({ error: "Log already exists for this date" });
        };

        const log = await WellnessLogs.create({
            user_id: userId,
            date,
            water_intake_oz,
            notes,
            steps,
            sleep_hours
        }, { transaction: t });

        await t.commit();

        return res.status(201).json(log);
    } catch (err) {
        await t.rollback()
        return res.status(500).json({ error: err.message})
    }
};

module.exports.upsert_wellness_today = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const today = new Date().toISOString().slice(0, 10);

    const { water_intake_oz, notes, steps, sleep_hours } = req.body;

    let log = await WellnessLogs.findOne({
      include: [
        {
          model: Client,
          required: true,
          where: { user_id: userId },
          attributes: [],
        },
      ],
      where: {
        date: today,
      },
    });

    if (log) {
      await log.update({
        ...(water_intake_oz !== undefined && { water_intake_oz }),
        ...(notes !== undefined && { notes }),
        ...(steps !== undefined && { steps }),
        ...(sleep_hours !== undefined && { sleep_hours }),
      });
    } else {
      const client = await Client.findOne({
        where: { user_id: userId },
      });

      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      log = await WellnessLogs.create({
        user_id: client.user_id,
        date: today,
        ...(water_intake_oz !== undefined && { water_intake_oz }),
        ...(notes !== undefined && { notes }),
        ...(steps !== undefined && { steps }),
        ...(sleep_hours !== undefined && { sleep_hours }),
      });
    }

    return res.json(log);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports.create_meal_log = async (req, res) => {
  try {
    const { meal_id, date, servings } = req.body;
    const user_id = req.user.user_id;

    const meal = await Meal.findByPk(meal_id);

    if (!meal) {
      return res.status(404).json({ error: "Meal not found" });
    }

    const calories_consumed = meal.calories_per_serving * servings;

    const log = await MealLog.create({
      user_id,
      meal_id,
      date,
      servings,
      calories_consumed
    });

    res.status(201).json(log);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to log meal." });
  }
};

module.exports.meal_logs = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { date } = req.query;

    const where = { user_id };

    if (date) {
      where.date = date;
    }

    const logs = await MealLog.findAll({
      where,
      include: [
        {
          model: Meal,
          as: "meal"
        }
      ],
      raw: true,
      nest: true
    });

    const formatted = logs.map(log => ({
        id: log.id,
        date: log.date,
        meal: {
          name: log.meal?.name
        },
        calories: log.calories_consumed,
        protein: log.meal?.protein,
        carbs: log.meal?.carbs,
        fats: log.meal?.fat,
        fiber: log.meal?.fiber,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
};

module.exports.edit_meal_log = async (req, res) => {
  try {
    const { id } = req.params;
    const { servings } = req.body;

    const log = await MealLog.findByPk(id, {
      include: [
        {
          model: Meal,
          as: "meal"
        }
      ]
    });

    if (!log) {
      return res.status(404).json({ error: "Log not found" });
    }

    log.servings = servings;
    log.calories_consumed = log.meal.calories_per_serving * servings;

    await log.save();

    res.json(log);

  } catch (err) {
    res.status(500).json({ error: "Failed to update log" });
  }
};

module.exports.delete_meal_log = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await MealLog.findByPk(id);

    if (!log) {
      return res.status(404).json({ error: "Log Not Found" })
    }

    await log.destroy();

    res.json({ message: "Delete successfully "});

  } catch (err) {
    res.status(500).json({ error: "Failed to delete log" });
  }
};

module.exports.create_custom_meal_log = async (req, res) => {
  try {
    const {
      name,
      calories_per_serving,
      servings,
      protein,
      carbs,
      fat,
      fiber,
      description,
      date
    } = req.body;

    const user_id = req.user.user_id;

    const meal = await Meal.create({
      name,
      calories_per_serving,
      is_premade: false,
      created_by_user_id: user_id,
      protein,
      carbs,
      fat,
      fiber,
      description,
    });

    const log = await MealLog.create({
      user_id,
      meal_id: meal.id,
      date,
      servings,
      calories_consumed: calories_per_serving * servings
    });

    res.status(201).json(log);

  } catch (err) {
    res.status(500).json({ error: "Failed to log custom meal" });
  }
};

const { CalorieTarget, sequelize } = require("../models");

module.exports.set_weekly_calorie_target = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.user_id;
    const { weekly_target } = req.body;

    if (!weekly_target || isNaN(weekly_target)) {
      await transaction.rollback();
      return res.status(400).json({ error: "Valid weekly_target required" });
    }

    const today = new Date().toISOString().split("T")[0];

    await CalorieTarget.update(
      { end_date: today },
      {
        where: {
          user_id: userId,
          end_date: null,
        },
        transaction,
      }
    );

    const newTarget = await CalorieTarget.create(
      {
        user_id: userId,
        weekly_target,
        start_date: today,
        end_date: null,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      message: "Weekly calorie target set successfully",
      target: newTarget,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ error: error.message });
  }
};

module.exports.upsert_daily_checkin = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const {
      mood_level,
      stress_level,
      motivation_level,
      energy_level,
      sleep_quality,
      body_quality,
    } = req.body;

    if (
      !mood_level ||
      !stress_level ||
      !motivation_level ||
      !energy_level ||
      !sleep_quality ||
      !body_quality
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const today = new Date().toISOString().split("T")[0];

    const [checkin, created] = await DailyCheckin.upsert({
      user_id: userId,
      date: today,
      mood_level,
      stress_level,
      motivation_level,
      energy_level,
      sleep_quality,
      body_quality,
    });

    return res.status(200).json({
      message: created
        ? "Daily check-in created"
        : "Daily check-in updated",
      checkin,
    });
  } catch (error) {
    console.error("upsert_daily_checkin error:", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports.get_today_checkin = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const today = new Date().toISOString().split("T")[0];

    const checkin = await DailyCheckin.findOne({
      where: {
        user_id: userId,
        date: today,
      },
    });

    if (!checkin) {
      return res.status(404).json({ error: "No check-in for today" });
    }

    return res.status(200).json({ checkin });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// STUFF FOR GRAPHS =====================================
const metricConfig = {
  steps: {
    model: WellnessLogs,
    column: "steps",
    aggregation: "SUM",
    userField: "user_id",

  },
  energy: {
    model: DailyCheckin,
    column: "energy_level",
    aggregation: "AVG",
    userField: "user_id",

  },
  stress: {
    model: DailyCheckin,
    column: "stress_level",
    aggregation: "AVG",
    userField: "user_id",

  },
  motivation: {
    model: DailyCheckin,
    column: "motivation_level",
    aggregation: "AVG",
    userField: "user_id",

  },
  calories: {
    model: MealLog,
    column: "calories_consumed",
    aggregation: "SUM",
    userField: "user_id",

  },
  volume: {
    model: WorkoutLog,
    column: "duration_minutes",
    aggregation: "SUM",
    userField: "client_id",
  }
};

const getPeriodGrouping = (period) => {
  switch (period) {
    case "week":
      return "DATE_FORMAT(date, '%Y-%u')";
    case "month":
      return "DATE_FORMAT(date, '%Y-%m')";
    case "year":
      return "YEAR(date)";
    case "day":
    default:
      return "DATE(date)";
  }
};

module.exports.get_metric = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { metric, period = "day", start, end } = req.query;

    const config = metricConfig[metric];
    const userField = config.userField || "user_id";

    if (!config) {
      return res.status(400).json({ error: "Invalid metric" });
    }

    const groupExpr = getPeriodGrouping(period);

    const results = await config.model.findAll({
      where: {
        [userField]: userId,
        date: {
          [Op.between]: [start, end],
        },
      },
      attributes: [
        [literal(groupExpr), "period"],
        [
          fn(config.aggregation, col(config.column)),
          "value",
        ],
      ],
      group: [literal(groupExpr)],
      order: [[literal(groupExpr), "ASC"]],
      raw: true,
    });

    return res.status(200).json(results);
  } catch (error) {
    console.error("getMetric error:", error);
    return res.status(500).json({ error: error.message });
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

module.exports.get_today_wellness = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const today = new Date().toISOString().split("T")[0];

    const checkin = await WellnessLogs.findOne({
      where: {
        user_id: userId,
        date: today,
      },
    });

    if (!checkin) {
      return res.status(404).json({ error: "No wellness log for today" });
    }

    return res.status(200).json({ checkin });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports.clear_wellness_field = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { field } = req.body;

    const today = new Date().toISOString().slice(0, 10);

    const log = await WellnessLogs.findOne({
      where: {
        user_id: userId,
        date: today,
      },
    });

    if (!log) {
      return res.status(404).json({ error: "No log for today" });
    }

    const validFields = {
      sleepHours: "sleep_hours",
      waterCurrent: "water_intake_oz",
      stepLog: "steps",
    };

    const dbField = validFields[field];

    if (!dbField) {
      return res.status(400).json({ error: "Invalid field" });
    }

    await log.update({
      [dbField]: 0,
    });

    return res.json(log);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports.get_today_activity = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const today = new Date().toISOString().slice(0, 10);
    console.log(today);

    console.log(userId);
    const total = await WorkoutLog.sum("duration_minutes", {
      where: {
        client_id: userId, 
        date: today,
      },
    });
    console.log(total);

    return res.json({
      totalMinutes: total || 0,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
