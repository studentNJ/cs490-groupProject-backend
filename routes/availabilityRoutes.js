const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const ctrl = require("../controllers/availabilityController");

/**
 * @swagger
 * tags:
 *   name: Coach Availability
 *   description: Recurring weekly availability rules
 */

/**
 * @swagger
 * /api/coach/availability:
 *   get:
 *     summary: List the logged-in coach's availability rules
 *     tags: [Coach Availability]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of rules }
 */
router.get("/", auth, ctrl.list_my_rules);

/**
 * @swagger
 * /api/coach/availability:
 *   post:
 *     summary: Create a new availability rule
 *     tags: [Coach Availability]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [day_of_week, start_time, end_time]
 *             properties:
 *               day_of_week: { type: integer, minimum: 0, maximum: 6 }
 *               start_time: { type: string, example: "09:00" }
 *               end_time: { type: string, example: "22:00" }
 *               duration_minutes: { type: integer, default: 60 }
 *     responses:
 *       201: { description: Rule created }
 */
router.post("/", auth, ctrl.create_rule);

/**
 * @swagger
 * /api/coach/availability/slots:
 *   get:
 *     summary: Get computed open slots for the logged-in coach
 *     tags: [Coach Availability]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: weeks
 *         schema: { type: integer, default: 8, maximum: 12 }
 *     responses:
 *       200: { description: Computed slots }
 */
router.get("/slots", auth, ctrl.list_my_slots);

/**
 * @swagger
 * /api/coach/availability/{ruleId}:
 *   delete:
 *     summary: Delete a rule
 *     tags: [Coach Availability]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete("/:ruleId", auth, ctrl.delete_rule);

module.exports = router;
