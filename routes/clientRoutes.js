const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const clientController = require("../controllers/clientController");

const coachController = require("../controllers/coachController");

router.get("/my-coach", auth, clientController.get_my_coach);
router.delete("/my-coach", auth, clientController.unhire_coach);
router.get(
  "/my-assigned-workouts",
  auth,
  clientController.get_my_assigned_workouts
);
router.patch(
  "/assignments/:assignmentId/complete",
  auth,
  clientController.complete_assignment
);

module.exports = router;
