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
        const {start, end} = req.query;

        //pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        const dateFilter = {};
        if (start && end) {
            dateFilter[Op.between] = [new Date(start), new Date(end)];
        } else if (start) {
            dateFiler[Op.gte] = new Date(start);
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
    const t = await sequelize.transaction();

    try {
        const userId = req.user.user_id; 

        const {
            date,
            notes,
            strengthLogs = [],
            cardioLogs = [],
        } = req.body;

        if (!date) {
            return res.status(400).json({ error: "Date is required"});
        }

        //checking if workout log already made
        const existingLog = await WorkoutLog.findOne({
            where: {
                client_id: userId,
                date: new Date(date),
            },
        });

        if (existingLog) {
            return res.status(409).json({
                error: "Workout log already exists for this date",
            }); 
        }

        

        const workoutLog = await WorkoutLog.create(
            {
                client_id: userId,
                date,
                notes: notes || null,
            },
            { transaction: t }
        );

        const workoutLogId = workoutLog.id;

        if (strengthLogs.length > 0) {
            const strengthData = strengthLogs.map((log) => ({
                workout_log_id: workoutLogId,
                exercise_id: log.exercise_id,
                sets: log.sets,
                reps: log.reps,
                weight: log.weight,
                duration: log.duration || null,
            }));

            await StrengthLogDetail.bulkCreate(strengthData, { transaction: t });
        }

        if (cardioLogs.length > 0) {
            const cardioData = cardioLogs.map((log) => ({
                workout_log_id: workoutLogId,
                exercise_id: log.exercise_id,
                duration: log.duration,                    distance: log.distance || null,
                calories_burned: log.calories_burned || null,
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
        res.status(500).json({ error: err.message })
    }
};

module.exports.wellness_logs = async (req, res) => {
    try {
        const userId = req.user.user_id;

        //pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        const logs = await WellnessLogs.findAndCountAll({
            include: [
                {
                    model: Client,
                    as: "client",
                    required: true,
                    where: {
                        user_id: userId
                    },
                    attributes: [],
                },
            ],
            order: [["created_at", "DESC"]],
            limit,
            offset,
            distinct: true,
            col: "wl_id"
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





