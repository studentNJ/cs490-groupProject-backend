const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const {
  getMyPlans,
  createPlan,
  updatePlan,
  deactivatePlan,
  getEarnings,
} = require("../controllers/coachPlanController");

router.use(auth, requireRole("coach"));

router.get("/", getMyPlans);
router.post("/", createPlan);
router.patch("/:planId", updatePlan);
router.delete("/:planId", deactivatePlan);
router.get("/earnings", getEarnings);

module.exports = router;
