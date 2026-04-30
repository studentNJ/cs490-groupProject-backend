const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const coachController = require("../controllers/coachController");
const reportController = require("../controllers/reportController");
const reviewController = require("../controllers/reviewController");
const { getCoachPlans } = require("../controllers/subscriptionController.js");

// Public coach directory
router.get("/", auth, coachController.browse_coaches);
router.delete("/request", auth, coachController.cancel_request);
router.get("/:coachUserId", auth, coachController.get_coach);
router.post("/:coachUserId/request", auth, coachController.request_coach);
router.post("/:coachUserId/report", auth, reportController.submit_coach_report);
router.post("/:coachUserId/review", auth, reviewController.submit_coach_review);
router.get("/:coachUserId/reviews", auth, reviewController.list_coach_reviews);

router.get("/:userId/plans", getCoachPlans);

module.exports = router;
