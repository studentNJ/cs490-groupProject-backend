const jwt = require("jsonwebtoken")

const signJWToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  )
}

module.exports = { signJWToken }
