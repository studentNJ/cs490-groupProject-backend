const express = require("express");
const auth = require("../middleware/authMiddleware");
const router = express.Router();
const workoutController = require("../controllers/workoutController");

// Exercise Catalog || Displays all workouts without filter
router.get("/custom", workoutController.browse_exercise);

// Browse Workouts
router.get("/premade", auth, workoutController.browse_workout);

// Create a Workout
router.post("/custom", auth, workoutController.create_workout);

// Delete a Workout
router.delete("/premade/:id", auth, workoutController.delete_workout);


module.exports = router;
