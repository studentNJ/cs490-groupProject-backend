const router = require("express").Router();
const auth = require("../middleware/authMiddleware");

const coachController = require("../controllers/coachController");
const requireActiveCoachRelationship = require("../middleware/requireActiveCoachRelationship");

// Any logged-in user can browse coaches
router.get("/", auth, coachController.browse_coaches);
router.delete("/request", auth, coachController.cancel_request);
router.get("/:coachUserId", auth, coachController.get_coach);
router.post("/:coachUserId/request", auth, coachController.request_coach);

router.get(
  "/clients/:clientUserId",
  auth,
  requireActiveCoachRelationship,
  coachController.get_client_detail
);

module.exports = router;
