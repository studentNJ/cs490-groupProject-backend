const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const { getMyPayments } = require("../controllers/paymentController");

router.get("/", auth, requireRole("client"), getMyPayments);

module.exports = router;
