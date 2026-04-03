const { Router } = require("express");
const authController = require("../controllers/authController.js");
const auth = require("../middleware/authMiddleware");
const googleAuthController = require("../controllers/googleAuthController");

const router = Router();

// -- Public Routes --
router.post("/register/client", authController.register_client_post);
router.post("/register/coach", authController.register_coach_post);
router.post(
  "/register/nutritionist",
  authController.register_nutritionist_post
);
router.post("/login", authController.login_post);

// Google Routes
router.get("/google", googleAuthController.google_redirect); // redirects the user to google's login page
router.get("/google/callback", googleAuthController.google_callback); // receives the authorization code from Google, exchanges it with user profile and creates the JWT token

// -- Protected Routes --
router.post("/logout", auth, authController.logout_post);
router.post("/delete-account", auth, authController.delete_account_post);
router.post("/delete-all-data", auth, authController.delete_all_data_post);
router.get("/me", auth, authController.get_me);
module.exports = router;
