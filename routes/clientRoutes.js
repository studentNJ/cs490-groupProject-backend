const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const clientController = require("../controllers/clientController");
const coachController = require("../controllers/coachController");
const requireRole = require("../middleware/requireRole");

const getMyPayments = require("../controllers/paymentController");

const {
  getMySubscription,
} = require("../controllers/subscriptionController.js");

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

router.get("/subscription", auth, requireRole("client"), getMySubscription);

router.patch("/assignments/:assignmentId/accept", auth, clientController.accept_assignment);
router.patch("/assignments/:assignmentId/decline", auth, clientController.decline_assignment);

module.exports = router;
