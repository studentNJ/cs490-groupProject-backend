const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");

router.put("/", auth, profileController.update_profile);

module.exports = router;
