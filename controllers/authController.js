const bcrypt = require("bcrypt")
const {
  Admin,
  User,
  Client,
  Coach,
  Nutritionist,
  CoachCertification,
} = require("../models")
const { signJWToken } = require("../utils/jwt")

const userIncludes = [
  { model: Client },
  { model: Coach },
  { model: Nutritionist },
  { model: Admin },
]

// ------ Helpers Functions -------
const checkDuplicate = async (email, username) => {
  const byEmail = await User.findOne({ where: { email } })
  if (byEmail) return "Email is already in use!"

  const byUsername = await User.findOne({ where: { username } })
  if (byUsername) return "Username is already taken!"

  return null
}

const buildUserResponse = async (user) => {
  return User.findByPk(user.user_id, {
    attributes: { exclude: ["password_hash"] },
    include: userIncludes,
  })
}

const buildAuthResponse = async (user, message) => {
  const token = await signJWToken(user)

  return {
    message,
    token,
    user: await buildUserResponse(user),
  }
}

module.exports.register_client_post = async (req, res) => {
  try {
    const { first_name, last_name, username, email, password, phone } =
      req.body

    // Check for duplicate email
    const generatedUsername = username || `${email.split("@")[0]}_${Date.now()}`
    const dupError = await checkDuplicate(email, generatedUsername)
    if (dupError) return res.status(409).json({ message: dupError })

    const password_hash = await bcrypt.hash(password, 10)
    const user = await User.create({
      first_name,
      last_name,
      email,
      username: generatedUsername,
      password_hash,
      phone,
      role: "client",
    })

    await Client.create({ user_id: user.user_id })

    res
      .status(201)
      .json(await buildAuthResponse(user, "Client registered successfully!"))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

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
    } = req.body

    const coachCertificationFile = req.files || []; // for certification uploaded files

    // Check if email or username is duplocate
    const generatedUsername = username || `${email.split("@")[0]}_${Date.now()}`
    const dupError = await checkDuplicate(email, generatedUsername)
    if (dupError) return res.status(409).json({ message: dupError })

    // Hash the password
    const password_hash = await bcrypt.hash(password, 10)
    const user = await User.create({
      first_name,
      last_name,
      email,
      username: generatedUsername,
      password_hash,
      phone,
      role: "coach",
    })
    const coach = await Coach.create({
      user_id: user.user_id,
      specialization,
      price,
    })
    // Coaches can also user Client features (U.C 2.4 role switch)
    await Client.create({ user_id: user.user_id })

    if (coachCertificationFile.length > 0) {
      const certificationRows = coachCertificationFile.map((file) => ({
        coach_id: user.user_id,
        document_url: `/uploads/${file.filename}`,
        status: "pending",
      }))
      await CoachCertification.bulkCreate(certificationRows)
    }

    res
      .status(201)
      .json(await buildAuthResponse(user, "Coach registered successfully!"))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports.register_nutritionist_post = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      username,
      email,
      password,
      phone,
      price,
    } = req.body

    const generatedUsername = username || `${email.split("@")[0]}_${Date.now()}`
    const dupError = await checkDuplicate(email, generatedUsername)
    if (dupError) return res.status(409).json({ message: dupError })

    const password_hash = await bcrypt.hash(password, 10)
    const user = await User.create({
      first_name,
      last_name,
      email,
      username: generatedUsername,
      password_hash,
      phone,
      role: "nutritionist",
    })
    await Nutritionist.create({ user_id: user.user_id, price })
    res
      .status(201)
      .json(
        await buildAuthResponse(user, "Nutritionist registered successfully!"),
      )
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports.register_admin_post = async (req, res) => {
  try {
    const { first_name, last_name, username, email, password, phone } = req.body
    const generatedUsername = username || `${email.split("@")[0]}_${Date.now()}`
    const dupError = await checkDuplicate(email, generatedUsername)
    if (dupError) return res.status(409).json({ message: dupError })

    const password_hash = await bcrypt.hash(password, 10)
    const user = await User.create({
      first_name,
      last_name,
      username: generatedUsername,
      email,
      password_hash,
      phone,
      role: "admin",
    })
    await Admin.create({ user_id: user.user_id })

    res
      .status(201)
      .json(await buildAuthResponse(user, "Admin registered successfully!"))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports.login_get = async (req, res) => {
  res.send("new signup")
}

module.exports.me_get = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id)
    if (!user) return res.status(404).json({ message: "User not found!" })

    res.status(200).json({ user: await buildUserResponse(user) })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports.login_post = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ where: { email } })
    if (!user) return res.status(404).json({ message: "Incorrect Email!" })

    if (!user.is_active)
      return res.status(403).json({ message: "Account is disabled!" })

    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect Password!" })

    // Update last_login timestamp
    await user.update({ last_login: new Date() })

    res.status(200).json(await buildAuthResponse(user, "Login successful!"))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports.logout_post = async (req, res) => {
  res.status(200).json({ message: "Logged out successfully." })
}

module.exports.delete_account_post = async (req, res) => {
  try {
    const { user_id } = req.user
    await User.update({ is_active: false }, { where: { user_id } })
    res.status(200).json({ message: "Account deactivated successfully." })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports.delete_all_data_post = async (req, res) => {
  try {
    const { user_id } = req.user
    const { password } = req.body

    const user = await User.findByPk(user_id)
    if (!user) return res.status(404).json({ message: "User not found!" })

    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch)
      return res.status(401).json({ message: "Password confirmation failed." })

    await user.destroy()
    res.status(200).json({ message: "All user data deleted." })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
