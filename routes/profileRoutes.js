const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");
const upload = require("../middleware/documentUpload");

// Client profile
router.put("/", auth, profileController.update_client_profile);

// Coach profile
router.get("/coach", auth, profileController.get_coach_profile);
router.put("/coach", auth, profileController.update_coach_profile);

// Profile picture (any role)
router.put(
  "/picture",
  auth,
  upload.single("profile_pic"),
  profileController.update_profile_picture
);

module.exports = router;
