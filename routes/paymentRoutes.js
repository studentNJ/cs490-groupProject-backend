const { Router } = require("express");
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const paymentController = require("../controllers/paymentController");

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing and history
 */

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Process a payment from client to coach
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [coach_id]
 *             properties:
 *               coach_id:
 *                 type: integer
 *                 description: ID of the coach being paid
 *               payment_method:
 *                 type: string
 *                 default: card
 *                 enum: [card, cash, bank_transfer]
 *               currency:
 *                 type: string
 *                 default: USD
 *     responses:
 *       201:
 *         description: Payment processed and subscription created/updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 payment:
 *                   type: object
 *                 subscription:
 *                   type: object
 *       400:
 *         description: Missing coach_id, no active relationship, or coach price not set
 *       403:
 *         description: Clients only
 *       404:
 *         description: Coach not found
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", auth, paymentController.process_payment);

/**
 * @swagger
 * /api/payments/history:
 *   get:
 *     summary: Get payment history for the logged-in client
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments ordered by date descending
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       payment_id:
 *                         type: integer
 *                       payment_amount:
 *                         type: number
 *                       payment_date:
 *                         type: string
 *                         format: date-time
 *                       payment_status:
 *                         type: string
 *                       payment_method:
 *                         type: string
 *                       currency:
 *                         type: string
 *       403:
 *         description: Clients only
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/history", auth, paymentController.get_payment_history);

/**
 * @swagger
 * /api/payments/earnings:
 *   get:
 *     summary: Get earnings summary for the logged-in coach
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coach earnings summary with recent payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_earnings:
 *                   type: number
 *                 total_payments:
 *                   type: integer
 *                 recent_payments:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Coaches only
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/earnings", auth, paymentController.get_coach_earnings);

/**
 * @swagger
 * /api/payments/stats:
 *   get:
 *     summary: Get platform-wide payment statistics (admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregate payment stats across all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_volume:
 *                   type: number
 *                 total_payments:
 *                   type: integer
 *                 payments_by_status:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *       403:
 *         description: Admins only
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/stats",
  auth,
  requireRole("admin"),
  paymentController.get_payment_stats
);

module.exports = router;
