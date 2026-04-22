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
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    //search
    const muscle = req.query.muscle || "";
    const equipment = req.query.equipment || "";

    const exercises = await Exercise.findAndCountAll({
      where: {
        ...(muscle && { pirmary_muscles: { [Op.like]: `%${muscle}%`}, }),
        ...(equipment && { equipment: { [Op.like]: `%${equipment}%`}, }),
      },
      limit,
      offset,
    });

    const totalPages = Math.max(1, Math.ceil(exercises.count / limit));

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
      include: [
        {
          model: db.User,
          attributes: ["user_id"],
        },
        {
            model: db.Exercise,
            through: {
              attributes: ["sets", "reps", "rest_seconds", "order_index", "notes"],
            },
        },
      ],
      limit,
      offset,
    });

    const totalPages = Math.max(1, Math.ceil(workouts.count / limit));
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
      const userId = req.user.user_id;

      //Checking for fields
      if(!title || !estimated_minutes || !exercises || exercises.length == 0) {
        await t.rollback();
        return res.status(400).json({ error: "Missing requires fields."});
      }

      //Exercises validation
      for (let ex of exercises) {
        if (!ex.exercise_id || !ex.sets || !ex.reps || ex.rest === undefined) {
          await t.rollback();
          return res.status(400).json({ error: "Invalid exercise data." });
        }
      }

      // Creating workout
      const workout = await Workout.create(
        {title, description, estimated_minutes, created_by_user_id: userId,},
        {transaction: t}
      );

      const workoutExerciseData = exercises.map((ex, index) => ({
        workout_id: workout.workout_id,
        exercise_id: ex.exercise_id,
        rest_seconds: ex.rest,
        notes: ex.notes || null,
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
      await t.rollback();
      res.status(500).json({ error: err.message})
    }
};

module.exports.delete_workout = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const userId = req.user.user_id;
    const workoutId = req.params.id;

    
    const workout = await Workout.findOne( {
      where: {
        workout_id: workoutId,
        created_by_user_id: userId,
      },
    });

    if(!workout) {
      await t.rollball();
      return res.status(404).json({ error: "Workout not found"});
    }

    await workoutExercise.destroy({
      where: { workout_id: workoutId },
      transaction: t,
    });

    await Workout.destroy({
      where: { workout_id: workoutId },
      transaction: t,
    });

    await t.commit();
    return res.json({ message: "Workout deleted Successfully" });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};