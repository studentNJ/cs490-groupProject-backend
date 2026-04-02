require("dotenv").config();
const express = require("express");
const sequelize = require("./config/database");
const bcrypt = require("bcrypt");
const { User } = require("./models");
const jwt = require("jsonwebtoken"); // JWT

const authRoutes = require("./routes/authRoutes");
const surveyRoutes = require("./routes/surveyRoutes");

const app = express();
// Middleware to parse JSON data for all incoming requests
app.use(express.json());

sequelize
  .authenticate()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("DB error:", err));

app.use("/auth", authRoutes); // Auth routes
app.use("/api/survey", surveyRoutes); // Initial Survey routes

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
