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

/**
 * @swagger
 * /api/coach/plans/earnings:
 *   get:
 *     summary: Get coach earnings summary
 *     tags: [Coach Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings data including total, monthly breakdown, and per-plan breakdown
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get("/earnings", getEarnings);

/**
 * @swagger
 * /api/coach/plans:
 *   get:
 *     summary: Get all plans for the logged-in coach
 *     tags: [Coach Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of coaching plans
 */
router.get("/", getMyPlans);

/**
 * @swagger
 * /api/coach/plans:
 *   post:
 *     summary: Create a new coaching plan
 *     tags: [Coach Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, plan_duration, price]
 *             properties:
 *               title:
 *                 type: string
 *               plan_duration:
 *                 type: integer
 *                 description: Duration in days
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Plan created successfully
 *       400:
 *         description: Missing required fields
 */
router.post("/", createPlan);

/**
 * @swagger
 * /api/coach/plans/{planId}:
 *   patch:
 *     summary: Update a coaching plan
 *     tags: [Coach Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               plan_duration:
 *                 type: integer
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *               description:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Plan updated
 *       404:
 *         description: Plan not found or not owned by coach
 */
router.patch("/:planId", updatePlan);

/**
 * @swagger
 * /api/coach/plans/{planId}:
 *   delete:
 *     summary: Deactivate a coaching plan (soft delete)
 *     tags: [Coach Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Plan deactivated
 *       404:
 *         description: Plan not found or not owned by coach
 */
router.delete("/:planId", deactivatePlan);

module.exports = router;
