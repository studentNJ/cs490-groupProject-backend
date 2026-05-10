require("dotenv").config();
const cors = require("cors");
const express = require("express");
const sequelize = require("./config/database");

// Route imports
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const profileRoutes = require("./routes/profileRoutes");
const surveyRoutes = require("./routes/surveyRoutes");
const messageRoutes = require("./routes/messageRoutes");
const coachRoutes = require("./routes/coachRoutes");
const clientRoutes = require("./routes/clientRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const coachDashboardRoutes = require("./routes/coachDashboardRoutes");
const qualificationRoutes = require("./routes/qualificationRoutes");
const certificationRoutes = require("./routes/certificationRoutes");
const logRoutes = require("./routes/logRoutes");
const coachPlanRoutes = require("./routes/coachPlanRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const mealRoutes = require("./routes/mealRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const progressPhotoRoutes = require("./routes/progressPhotoRoutes");
const sessionPackageRoutes = require("./routes/sessionPackageRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const sessionPurchaseRoutes = require("./routes/sessionPurchaseRoutes");

const sessionBookingRoutes = require("./routes/sessionBookingRoutes");
const nutritionistRoutes = require("./routes/nutritionistRoutes");

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Swagger
let swaggerUi;
let swaggerJsdoc;

try {
  swaggerUi = require("swagger-ui-express");
  swaggerJsdoc = require("swagger-jsdoc");
} catch (err) {
  swaggerUi = null;
  swaggerJsdoc = null;
}

if (swaggerUi && swaggerJsdoc) {
  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: "3.0.0",
      info: { title: "Fitness API", version: "1.0.0" },
      servers: [{ url: "http://localhost:4000" }],
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
        schemas: {
          AuthResponse: {
            type: "object",
            properties: {
              message: { type: "string" },
              token: { type: "string" },
              user: { type: "object" },
            },
          },
          ErrorResponse: {
            type: "object",
            properties: {
              message: { type: "string" },
              error: { type: "string" },
            },
          },
        },
      },
    },
    apis: ["./routes/*.js"],
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// --- Middleware ---
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// --- DB connection check ---
sequelize
  .authenticate()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("DB error:", err));

// --- Routes ---
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/api/survey", surveyRoutes);
app.use("/api/profile", profileRoutes);
app.use("/profile", profileRoutes);
app.use("/survey", surveyRoutes);
app.use("/message", messageRoutes);
app.use("/api/workout", workoutRoutes);
app.use("/api/coaches", coachRoutes);
app.use("/api/photos", progressPhotoRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/coach/plans", coachPlanRoutes);
app.use("/api/coach/packages", sessionPackageRoutes);
app.use("/api/coach/availability", availabilityRoutes);
app.use("/api/sessions", sessionPurchaseRoutes);
app.use("/api/sessions", sessionBookingRoutes);
app.use("/api/coach", coachDashboardRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/qualifications", qualificationRoutes);
app.use("/api/certifications", certificationRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/nutritionist", nutritionistRoutes);

// Static file serving
app.use("/uploads", express.static("uploads"));

module.exports = app;
