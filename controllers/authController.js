const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { User, Client, Coach, Nutritionist } = require("../models");

// Client Register
module.exports.register_client_post = async (req, res) => {
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
};
//Coach Register
module.exports.register_coach_post = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      username,
      email,
      password,
      phone,
      specialization,
      price,
    } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      first_name,
      last_name,
      username,
      email,
      password_hash,
      phone,
      role: "coach",
    });
    await Coach.create({ user_id: user.user_id, specialization, price });

    // Also create client profile so coach can use client features
    await Client.create({ user_id: user.user_id });

    res.status(201).json({ message: "Coach registered successfully!", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Nutritionist Register
module.exports.register_nutritionist_post = async (req, res) => {
  try {
    const { 
      first_name, 
      last_name, 
      username, 
      email, 
      password, 
      phone, 
      price
      } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      first_name,
      last_name,
      username,
      email,
      password_hash,
      phone,
      role: "nutritionist",
    });
    await Nutritionist.create({ user_id: user.user_id, price });
    res
      .status(201)
      .json({ message: "Nutritionist registered successfully!", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports.register_admin_post = async (req, res) => {
  try {
    const { 
      first_name,
      last_name, 
      username, 
      email, 
      password, 
      phone 
    } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      first_name,
      last_name,
      username,
      email,
      password_hash,
      phone,
      role: "admin",
    });
    await Admin.create({ user_id: user.user_id });
    res.status(201).json({ message: "Admin registered successfully!", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports.login_get = async (req, res) => {
  res.send("new signup");
};

module.exports.login_post = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "Incorrect Email!" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect Password!" });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.status(200).json({ message: "Login successful!", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
