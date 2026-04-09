const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { User, Client, Coach, Nutritionist, Admin } = require("../models");

// ------ Helpers Functions -------
const checkDuplicate = async (email, username) => {
  const byEmail = await User.findOne({ where: { email } });
  if (byEmail) return "Email is already in use!";

  const byUsername = await User.findOne({ where: { username } });
  if (byUsername) return "Username is already taken!";

  return null;
};

const signJWToken = async (user) => {
  const token = jwt.sign(
    {
      user_id: user.user_id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return token;
};

const buildUserResponse = async (user) => {
  const responseUser = {
    user_id: user.user_id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    username: user.username,
    role: user.role,
    phone: user.phone,
    profile_pic: user.profile_pic,
    is_active: user.is_active,
    last_login: user.last_login,
  };

  if (user.role === "coach") {
    const coach = await Coach.findByPk(user.user_id);
    if (coach) {
      responseUser.specialization = coach.specialization;
      responseUser.price = coach.price;
      responseUser.is_approved = coach.is_approved;
    }
  }

  if (user.role === "nutritionist") {
    const nutritionist = await Nutritionist.findByPk(user.user_id);
    if (nutritionist) {
      responseUser.price = nutritionist.price;
      responseUser.is_approved = nutritionist.is_approved;
    }
  }

  return responseUser;
};

// --------------------------------------

// UC 1.1 - Register Client
module.exports.register_client_post = async (req, res) => {
  try {
    const { first_name, last_name, username, email, password, phone } =
      req.body;

    // Check for duplicate email
    const dupError = await checkDuplicate(email, username);
    if (dupError) return res.status(409).json({ message: dupError });

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

    const token = await signJWToken(user);

    res.status(201).json({
      message: "Client registered successfully!",
      token,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// UC 1.2 - Register Coach
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

    // Check if email or username is duplocate
    const dupError = await checkDuplicate(email, username);
    if (dupError) return res.status(409).json({ message: dupError });
    // Hash the password
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
    const coach = await Coach.create({
      user_id: user.user_id,
      specialization,
      price,
    });
    // Coaches can also user Client features (U.C 2.4 role switch)
    await Client.create({ user_id: user.user_id });

    const token = await signJWToken(user);

    res.status(201).json({
      message: "Coach registered successfully!",
      token,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
        role: user.role,
        specialization: coach.specialization,
        price: coach.price,
      },
    });
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

    const dupError = await checkDuplicate(email, username);
    if (dupError) return res.status(409).json({ message: dupError });

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
    const token = await signJWToken(user);

    res
      .status(201)
      .json({
        message: "Nutritionist registered successfully!",
        token,
        user: await buildUserResponse(user),
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports.register_admin_post = async (req, res) => {
  try {
    if (!process.env.ADMIN_SECRET) {
      return res.status(500).json({ message: "ADMIN_SECRET is not configured." });
    }

    if (req.headers["x-admin-secret"] !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: "Invalid admin registration secret." });
    }

    const { 
      first_name,
      last_name, 
      username, 
      email, 
      password, 
      phone 
    } = req.body;

    const dupError = await checkDuplicate(email, username);
    if (dupError) return res.status(409).json({ message: dupError });

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

    const token = await signJWToken(user);

    res.status(201).json({
      message: "Admin registered successfully!",
      token,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports.login_get = async (req, res) => {
  res.send("new signup");
};

module.exports.me_get = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id);
    if (!user) return res.status(404).json({ message: "User not found!" });

    res.status(200).json({ user: await buildUserResponse(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UC 1.5 - Login
module.exports.login_post = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "Incorrect Email!" });

    if (!user.is_active)
      return res.status(403).json({ message: "Account is disabled!" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect Password!" });

    // Update last_login timestamp
    await user.update({ last_login: new Date() });

    const token = await signJWToken(user);
    res.status(200).json({
      message: "Login successful!",
      token,
      user: await buildUserResponse(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UC 1.6 Logout
// JWT is stateless so logout is handled client-side by discarding the token.

module.exports.logout_post = async (req, res) => {
  res.status(200).json({ message: "Logged out successfully." });
};

// 1.8 Delete account (soft delete)
module.exports.delete_account_post = async (req, res) => {
  // Soft delete: sets is_active = false
  // change the is_active state to false
  try {
    const { user_id } = req.user;
    await User.update({ is_active: false }, { where: { user_id } });
    res.status(200).json({ message: "Account deactivated successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UC 1.9 Delete all user data (Hard delete)
module.exports.delete_all_data_post = async (req, res) => {
  // Requires confirmed intent from the client (e.g. password re-confirmation)
  try {
    const { user_id } = req.user;
    const { password } = req.body;

    const user = await User.findByPk(user_id);
    if (!user) return res.status(404).json({ message: "User not found!" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ message: "Password confirmation failed." });

    await user.destroy(); // cascades to Client/Coach/Nutritionist if FK set up
    res.status(200).json({ message: "All user data deleted." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
