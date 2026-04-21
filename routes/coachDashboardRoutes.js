const express = require("express");
const router = express.Router();
const coachController = require("../controllers/coachController");
const auth = require("../middleware/authMiddleware");

router.get("/requests", auth, coachController.get_pending_requests);
router.post(
  "/requests/:clientUserId/approve",
  auth,
  coachController.approve_request
);
router.post(
  "/requests/:clientUserId/reject",
  auth,
  coachController.reject_request
);

router.get("/clients", auth, coachController.get_active_clients);

module.exports = router;
