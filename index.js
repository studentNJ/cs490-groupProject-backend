require("dotenv").config();
const express = require("express");
const sequelize = require("./config/database");
const bcrypt = require("bcrypt");
const { User } = require("./models");
const jwt = require("jsonwebtoken"); // JWT
require("dotenv").config();
const { initSocket } = require("./socket");

const authRoutes = require("./routes/authRoutes");
const surveyRoutes = require("./routes/surveyRoutes");
const profileRoutes = require("./routes/profileRoutes");
const messageRoutes = require("./routes/messageRoutes");
const coachRoutes = require("./routes/coachRoutes");
const clientRoutes = require("./routes/clientRoutes");
const workoutRoutes = require("./routes/workoutRoutes");

// CORS
const cors = require("cors");

const app = express();
app.use(
  cors({
    origin: ["http://localhost:3001", "http://localhost:3000"], // tells the browser "allow requests from this frontend URL"
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
app.use("/message", messageRoutes); // Profile routes
app.use("/api/workout", workoutRoutes);
app.use("/api/coach", coachRoutes);
app.use("/api/client", clientRoutes);

const server = app.listen(4000, () => {
  console.log("Server running on port 4000");
});

initSocket(server);
