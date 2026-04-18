const express = require("express");
const router = express.Router();
const coachController = require("../controllers/coachController");
const { auth } = require("../middleware/auth");

router.get("/requests", auth, coachController.get_pending_requests);

module.exports = router;
