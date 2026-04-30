const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole.js");
const {
  subscribe,
  cancelSubscription,
} = require("../controllers/subscriptionController.js");

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Client coaching plan subscriptions
 */

/**
 * @swagger
 * /api/subscriptions:
 *   post:
 *     summary: Subscribe to a coaching plan
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [coaching_plan_id]
 *             properties:
 *               coaching_plan_id:
 *                 type: integer
 *                 description: ID of the coaching plan to subscribe to
 *     responses:
 *       201:
 *         description: Subscription created successfully with payment record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payment:
 *                   type: object
 *                   properties:
 *                     payment_id:
 *                       type: integer
 *                     payment_amount:
 *                       type: number
 *                     payment_status:
 *                       type: string
 *                     transaction_id:
 *                       type: string
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     subscription_id:
 *                       type: integer
 *                     start_date:
 *                       type: string
 *                       format: date
 *                     end_date:
 *                       type: string
 *                       format: date
 *                     status:
 *                       type: string
 *                       enum: [active, cancelled, expired]
 *       400:
 *         description: coaching_plan_id is required
 *       403:
 *         description: Clients only
 *       404:
 *         description: Plan not found or no longer available
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", auth, requireRole("client"), subscribe);

/**
 * @swagger
 * /api/subscriptions/{id}/cancel:
 *   patch:
 *     summary: Cancel an active subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subscription ID to cancel
 *     responses:
 *       200:
 *         description: Subscription cancelled. Access continues until end date.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     subscription_id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [cancelled]
 *                     cancelled_at:
 *                       type: string
 *                       format: date-time
 *                     end_date:
 *                       type: string
 *                       format: date
 *       400:
 *         description: Subscription is already cancelled
 *       403:
 *         description: Clients only
 *       404:
 *         description: Subscription not found
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id/cancel", auth, requireRole("client"), cancelSubscription);

module.exports = router;
