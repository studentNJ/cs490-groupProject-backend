const jwt = require("jsonwebtoken");

const signJWToken = (user) => {
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

module.exports = { signJWToken };
