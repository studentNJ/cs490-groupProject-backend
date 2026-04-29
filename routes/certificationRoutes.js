const express = require("express");
const router = express.Router();
const certificationController = require("../controllers/certController");
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/documentUpload");

router.post("/", auth, upload.single("document"), certificationController.add_certification);
router.post("/:id/verify", auth, certificationController.verify_certification);
router.get("/", auth, certificationController.get_certification);
module.exports = router;