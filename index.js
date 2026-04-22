require("dotenv").config()
const cors = require("cors")
const express = require("express")
const sequelize = require("./config/database")

const authRoutes = require("./routes/authRoutes")
const adminRoutes = require("./routes/adminRoutes")
const profileRoutes = require("./routes/profileRoutes")
const surveyRoutes = require("./routes/surveyRoutes")

const app = express()
// Middleware to parse JSON data for all incoming requests
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  }),
)
app.use(express.json())

sequelize
  .authenticate()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("DB error:", err))

app.use("/auth", authRoutes)
app.use("/admin", adminRoutes)
app.use("/profile", profileRoutes)
app.use("/survey", surveyRoutes)

app.listen(4000, () => {
  console.log("Server running on port 4000")
})
