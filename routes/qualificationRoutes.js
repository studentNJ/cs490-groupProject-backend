const express = require("express");
const router = express.Router();
const qualificationController = require("../controllers/qualController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, qualificationController.add_qualification);
router.get("/", auth, qualificationController.get_qualification);
router.delete("/:id", auth, qualificationController.delete_qualification);
module.exports = router;