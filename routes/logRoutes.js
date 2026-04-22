const router = require("express").Router();
const auth = require("../middleware/authMiddleware");

const logController = require(".../controllers/logController");

// Workout Logs
router.get("/workout-log", auth, logController.workout-logs);
router.post("/workout-log", auth, logController.create_workout_log);

//Wellness
router.get("/wellness-check", auth, logController.wellness-logs);
router.post("/wellness-check", auth, logController.create_wellness_log);

//Meals
//router.get("/meal-log", auth, logController.meal_logs);
//router.post("/meal-logs", auth, logController.create_meal_log);


module.exports = router;