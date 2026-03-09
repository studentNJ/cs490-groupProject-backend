const { Router } = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models/index.js");
const authController = require("../controllers/authController.js");

const router = Router();

// Client Signup
router.post("/signup/client", async (req, res) => {
  try {
    const { first_name, last_name, username, email, password, phone } =
      req.body;
    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name,
      last_name,
      username,
      email,
      password_hash,
      phone,
      role: "client",
    });

    await Client.create({ user_id: user.user_id });

    res.status(201).json({ message: "Client registered successfully!", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/login", authController.login_get);

router.post("/register/client", authController.register_client_post);
router.post("/register/coach", authController.register_coach_post);
router.post(
  "/register/nutritionist",
  authController.register_nutritionist_post
);

router.post("/login", authController.login_post);

module.exports = router;
