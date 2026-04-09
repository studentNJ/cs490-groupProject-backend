const db = require("../models");
const { Op } = require("sequelize") //used for search 
const Exercise = db.Exercise;  
const Workout = db.Workout; 
const workoutExercise = db.workoutExercise;

// U.C 7.4-7.6 Browse exercise catalog || Filter by Muscle Group || Filter by Equipment
module.exports.browse_exercise = async (req, res) => {
  try {

    //pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    //search
    const search = req.query.search || "";

    const exercises = await Exercise.findAndCountAll({
      where: search
        ? {
          [Op.or]: [
            { equipment: { [Op.like]: `%${search}%` } },
            { pirmary_muscles: { [Op.like]: `%${search}%` } },
          ],
        }
      : {},

      limit,
      offset,
    });

    const totalPages = Math.ceil(exercises.count / limit)

    return res.json({
      totalItems: exercises.count, // Total # of Exercises
      totalPages, // Total # of pages too hold all exercises
      currentPage: page, // Current page 
      data: exercises.rows, // Next 10 (or whatever limit is) exercises
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// U.C 7.1 View Workouts
module.exports.browse_workout = async (req, res) => {
  try {
    const userId = req.user.user_id;

    //pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const workouts = await Workout.findAndCountAll({
      where: {
        created_by_user_id: userId,
      },
      include: {
        model: db.User,
        attributes: ["user_id"]
      },
      limit,
      offset,
    });

    const totalPages = Math.ceil(workouts.count / limit)
    return res.json({
      totalItems: workouts.count, // Total # of Workouts created by User
      totalPages, // Total # of pages required to fit all workouts
      currentPage:page, 
      data: workouts.rows, // Next 10 (or whatever limit is) Workouts
    })

    return res.json(workouts);

  } catch (err) {
    res.status(500).json({ error: err.message});
  }
};

// U.C 7.1 Create Workout Plan (Client)
module.exports.create_workout = async (req, res) => {
  const t = await db.sequelize.transaction(); // makes everything temp until commit
  
  try {
      const { title, description, estimated_minutes, exercises } = req.body;
      userId = req.user.user_id;

      //Checking for fields
      if(!title || !estimated_minutes || !exercises) {
        await t.rollback();
        return res.status(400).json({ error: "Missing requires fields."});
      }

      // Creating workout
      const workout = await Workout.create(
        {title, description, estimated_minutes, created_by_user_id: userId,},
        {transaction: t}
      );

      const workoutExerciseData = exercises.map((ex, index) => ({
        workout_id: workout.workout_id,
        exercise_id: ex.exercise_id,
        sets: ex.sets,
        reps: ex.reps,
        order_index: index + 1,
      })); 

      //inserts workout_exercises in bulk 
      await workoutExercise.bulkCreate(workoutExerciseData, { transaction: t, });

      //commits everything
      await t.commit();
      return res.status(201).json({
        message: "Workout created successfully",
        workout_id: workout.workout_id,
      });
    }  catch (err) {
      res.status(500).json({ error: err.message})
    }
};