const { Router } = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models/index.js");
const authController = require("../controllers/authController.js");

const router = Router();

// Login
router.get("/login", authController.login_get);
router.post("/login", authController.login_post);

// Register
router.post("/register/client", authController.register_client_post);
router.post("/register/coach", authController.register_coach_post);
router.post(
  "/register/nutritionist",
  authController.register_nutritionist_post
);

module.exports = router;
