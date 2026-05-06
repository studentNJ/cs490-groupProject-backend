const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const ctrl = require("../controllers/sessionPurchaseController");

/**
 * @swagger
 * tags:
 *   name: Session Purchases
 *   description: Client purchases of session packages
 */

/**
 * @swagger
 * /api/sessions/purchase:
 *   post:
 *     summary: Purchase a session package
 *     tags: [Session Purchases]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [package_id]
 *             properties:
 *               package_id: { type: integer }
 *     responses:
 *       201: { description: Purchased }
 *       400: { description: Validation error }
 *       403: { description: Clients only }
 *       404: { description: Package not found }
 */
router.post("/purchase", auth, ctrl.purchase_package);

/**
 * @swagger
 * /api/sessions/purchases:
 *   get:
 *     summary: List the logged-in client's purchases
 *     tags: [Session Purchases]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of purchases }
 */
router.get("/purchases", auth, ctrl.list_my_purchases);

/**
 * @swagger
 * /api/sessions/purchases/active-with/{coachUserId}:
 *   get:
 *     summary: Get the client's active purchase with a specific coach
 *     tags: [Session Purchases]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: coachUserId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Active purchase or null }
 */
router.get(
  "/purchases/active-with/:coachUserId",
  auth,
  ctrl.active_purchase_with_coach
);

module.exports = router;
