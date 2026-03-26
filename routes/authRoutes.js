const { Router } = require("express");
const authController = require("../controllers/authController.js");
const auth = require("../middleware/authMiddleware");

const router = Router();

// -- Public Routes --
router.post("/register/client", authController.register_client_post);
router.post("/register/coach", authController.register_coach_post);
router.post(
  "/register/nutritionist",
  authController.register_nutritionist_post
);
router.post("/login", authController.login_post);

// -- Protected Routes --
router.post("/logout", auth, authController.logout_post);
router.post("/delete-account", auth, authController.delete_account_post);
router.post("/delete-all-data", auth, authController.delete_all_data_post);

module.exports = router;
