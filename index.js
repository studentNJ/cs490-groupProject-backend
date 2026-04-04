require("dotenv").config();
const express = require("express");
const sequelize = require("./config/database");
const bcrypt = require("bcrypt");
const { User } = require("./models");
const jwt = require("jsonwebtoken"); // JWT
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const surveyRoutes = require("./routes/surveyRoutes");
const profileRoutes = require("./routes/profileRoutes");
// CORS
const cors = require("cors");

const app = express();
app.use(
  cors({
    origin: "http://localhost:3001", // tells the browser "allow requests from this frontend URL"
    credentials: true, // allows tokens and cookies to be sent with requests.
  })
);
// Middleware to parse JSON data for all incoming requests
app.use(express.json());

sequelize
  .authenticate()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("DB error:", err));

app.use("/auth", authRoutes); // Auth routes
app.use("/api/survey", surveyRoutes); // Initial Survey routes
app.use("/api/profile", profileRoutes); // Profile routes

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
