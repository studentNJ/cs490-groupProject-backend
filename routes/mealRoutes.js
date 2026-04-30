const express = require("express");
const auth = require("../middleware/authMiddleware");
const router = express.Router();
const mealController = require("../controllers/mealController")

router.get("/", auth, mealController.get_meals);
router.post("/meal-plan", auth, mealController.create_meal_plan);

router.get("/meal-plan/:id", auth, mealController.get_meal_plan);
router.delete("/meal-plan/:id", auth, mealController.delete_meal_plan);
router.get("/browse/meal-plan/", auth, mealController.browse_meal_plans);
router.post("/meal-logs/from-plan/:mealPlanId", auth, mealController.log_meal_plan);
module.exports = router;

