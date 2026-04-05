const bcrypt = require("bcrypt");
const { User, Client, Coach, Nutritionist } = require("../models");
const { signJWToken } = require("../utils/jwt");

// ------ Helpers Functions -------
const checkDuplicate = async (email) => {
  const byEmail = await User.findOne({ where: { email } });
  if (byEmail) return "Email is already in use!";

  return null;
};

// --------------------------------------

// UC 1.1 - Register Client
module.exports.register_client_post = async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone } = req.body;

    // Check for duplicate email
    const dupError = await checkDuplicate(email);
    if (dupError) return res.status(409).json({ message: dupError });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      first_name,
      last_name,
      email,
      username: email.split("@")[0] + "_" + Date.now(), // auto-generated
      password_hash,
      phone,
      role: "client",
    });

    await Client.create({ user_id: user.user_id });

    const token = signJWToken(user);

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
      email,
      password,
      phone,
      specialization,
      price,
    } = req.body;

    // Check if email or username is duplocate
    const dupError = checkDuplicate(email);
    if (dupError) return res.status(409).json({ message: dupError });
    // Hash the password
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      first_name,
      last_name,
      email,
      username: email.split("@")[0] + "_" + Date.now(), // auto-generated
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

    const token = signJWToken(user);

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
    const { first_name, last_name, email, password, phone, price } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      first_name,
      last_name,
      email,
      username: email.split("@")[0] + "_" + Date.now(),
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

    // Create JWT token
    const token = signJWToken(user);
    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        user_id: user.user_id,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
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
    User.update({ is_active: false }, { where: { user_id } });
    res.status(200).json({ message: "Account deactivated successfully." });
  } catch (error) {
    res.status(500).json({ error: err.message });
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

// U.C 1.3 Complete Client Initial Survey
module.exports.submit_client_survey = async (req, res) => {
  try {
    // Step A: Who is making this request? (from JWT via middleware)
    const user_id = req.user.user_id;

    // Step B: What did they send?
    const {
      goal,
      typeWorkout,
      dietPreference,
      currentActivity,
      coachHelp,
      nutritionistHelp,
      workoutDay,
    } = req.body;

    // Step C: Find their client record
    const client = await Client.findByPk(user_id);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Step D: Update the record with survey answers
    await client.update({
      goal,
      type_workout: typeWorkout,
      diet_preference: dietPreference,
      current_activity: currentActivity,
      coach_help: coachHelp,
      nutritionist_help: nutritionistHelp,
      workout_day: parseInt(workoutDay),
      survey_completed: true,
    });

    // Step E: Send success response
    res.status(200).json({ message: "Survey submitted successfully!" });
  } catch (error) {}
};

// For fetching logged-in User data
module.exports.get_me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      attributes: [
        "user_id",
        "first_name",
        "last_name",
        "email",
        "phone",
        "username",
        "profile_pic",
        "role",
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    let goal = null;
    if (user.role === "client") {
      const client = await Client.findByPk(req.user.user_id);
      if (client) {
        goal = client.goal;
      }
    }

    res.status(200).json({ user: { ...user.toJSON(), goal } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
