const express = require("express");
const router = express.Router();
const certificationController = require("../controllers/certController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, certificationController.add_certification);
router.post("/", auth, certificationController.verify_certification);
module.exports = router;