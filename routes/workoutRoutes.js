const express = require("express");
const auth = require("../middleware/authMiddleware");
const router = express.Router();
const workoutController = require("../controllers/workoutController");

// Exercise Catalog || Displays all workouts without filter
router.get("/create", auth, workoutController.browse_exercise);

// Browse Workouts
router.get("/", auth, workoutController.browse_workout);

// Create a Workout
router.post("/create", auth, workoutController.create_workout);


module.exports = router;
