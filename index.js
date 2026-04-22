require("dotenv").config()
const cors = require("cors")
const express = require("express")
const sequelize = require("./config/database")
const { initSocket } = require("./socket")

const authRoutes = require("./routes/authRoutes")
const adminRoutes = require("./routes/adminRoutes")
const profileRoutes = require("./routes/profileRoutes")
const surveyRoutes = require("./routes/surveyRoutes")
const messageRoutes = require("./routes/messageRoutes")
const coachRoutes = require("./routes/coachRoutes")
const clientRoutes = require("./routes/clientRoutes")
const workoutRoutes = require("./routes/workoutRoutes")
const coachDashboardRoutes = require("./routes/coachDashboardRoutes")
const qualificationRoutes = require("./routes/qualificationRoutes")
const certificationRoutes = require("./routes/certificationRoutes")
const paymentRoutes = require("./routes/paymentRoutes")

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
app.use("/api/survey", surveyRoutes)
app.use("/api/profile", profileRoutes)
app.use("/profile", profileRoutes)
app.use("/survey", surveyRoutes)
app.use("/message", messageRoutes)
app.use("/api/workout", workoutRoutes)
app.use("/api/coaches", coachRoutes)
app.use("/api/coach", coachDashboardRoutes)
app.use("/api/client", clientRoutes)
app.use("/api/qualifications", qualificationRoutes)
app.use("/api/certifications", certificationRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/uploads", express.static("uploads"))

const server = app.listen(4000, () => {
  console.log("Server running on port 4000")
})

initSocket(server)
