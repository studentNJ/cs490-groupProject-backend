const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const coachController = require("../controllers/coachController");
const { getCoachPlans } = require("../controllers/subscriptionController.js");

// Public coach directory
router.get("/", auth, coachController.browse_coaches);
router.delete("/request", auth, coachController.cancel_request);
router.get("/:coachUserId", auth, coachController.get_coach);
router.post("/:coachUserId/request", auth, coachController.request_coach);

router.get("/:userId/plans", getCoachPlans);

module.exports = router;
