const router = require("express").Router();
const auth = require("../middleware/authMiddleware");

const logController = require("../controllers/logController");

// Workout Logs
router.get("/workout-log", auth, logController.workout_logs);
router.post("/workout-log", auth, logController.create_workout_log);

//Wellness
router.get("/wellness-check", auth, logController.wellness_logs);
router.post("/wellness-check", auth, logController.create_wellness_log);
router.put("/wellness-check/:id", auth, logController.edit_wellness_log);
router.delete("/wellness-log/:id", auth, logController.delete_wellness_log);

//Meals
router.get("/meal-log", auth, logController.meal_logs);
router.post("/meal-log", auth, logController.create_meal_log);
router.put("/meal-log/:id", auth, logController.edit_meal_log);
router.delete("/meal-log/:id", auth, logController.delete_meal_log);
router.post("/meal-log/custom", auth, logController.create_custom_meal_log);
router.post("/calorie-target", auth, logController.set_weekly_calorie_target);

//Graphing Logged Metrics
router.get("/graph", auth, logController.get_metric);
module.exports = router;