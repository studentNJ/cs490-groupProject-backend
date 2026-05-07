"use strict"

const router = require("express").Router()
const auth = require("../middleware/authMiddleware")
const n = require("../controllers/nutritionistController")

// Public browse
router.get("/browse", auth, n.browse_nutritionists)
router.get("/browse/:nutritionistUserId", auth, n.get_nutritionist)

// Client-side relationship
router.get("/my-nutritionist", auth, n.get_my_nutritionist)
router.delete("/my-nutritionist", auth, n.unhire_nutritionist)
router.post("/request/:nutritionistUserId", auth, n.request_nutritionist)

// Nutritionist dashboard
router.get("/clients", auth, n.get_clients)
router.get("/requests", auth, n.get_pending_requests)
router.post("/requests/:clientUserId/approve", auth, n.approve_request)
router.post("/requests/:clientUserId/reject", auth, n.reject_request)
router.get("/clients/:clientUserId/meal-plans", auth, n.get_client_meal_plans)
router.post("/clients/:clientUserId/meal-plan", auth, n.assign_meal_plan)
router.get("/meals", auth, n.get_meals)
router.post("/meals", auth, n.create_meal)

module.exports = router
