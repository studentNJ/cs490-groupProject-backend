const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole.js");

const {
  subscribe,
  getMySubscription,
  cancelSubscription,
} = require("../controllers/subscriptionController.js");

router.post("/", auth, requireRole("client"), subscribe);
router.patch("/:id/cancel", auth, requireRole("client"), cancelSubscription);

module.exports = router;
