// middleware/authMiddleware.js

/*
    Middleware is a function that runs between the request arriving and our controller handling it. 
    
    Request -> authMiddleware -> controller

*/
// Verifies the JWT on every protected route.

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // Fetch HTTP request header
  const authHeader = req.headers.authorization;

  // If token doesn't exist in HTPP request header, reject it
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "No token provided!" });

  // Grab the token from HTTP req header
  const token = authHeader.split(" ")[1];

  // Check the signature is valid and the token hasn't expired, if it passes, it returns the payload {user_id, role} -- gets attached to req.user
  try {
    console.log("JWT_SECRET:", process.env.JWT_SECRET);
    console.log("Token:", token.substring(0, 20) + "...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); // All good pass it to contoller
  } catch (error) {
    console.log("JWT Error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};
