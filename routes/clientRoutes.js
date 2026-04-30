const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const clientController = require("../controllers/clientController");
const requireRole = require("../middleware/requireRole");

const {
  getMySubscription,
} = require("../controllers/subscriptionController.js");

/**
 * @swagger
 * tags:
 *   name: Client
 *   description: Client-side endpoints — coach relationship, assigned workouts, subscription
 */

/**
 * @swagger
 * /api/client/my-coach:
 *   get:
 *     summary: Get the client's current coach relationship (pending or active)
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Active-Role
 *         schema: { type: string, enum: [client, coach] }
 *     responses:
 *       200:
 *         description: Returns the relationship state and coach info, or { state, coach } when none exists
 *       403:
 *         description: Only clients can view their coach
 *       500:
 *         description: Server error
 */
router.get("/my-coach", auth, clientController.get_my_coach);

/**
 * @swagger
 * /api/client/my-coach:
 *   delete:
 *     summary: End the client's active coaching relationship (unhire)
 *     description: Sets the relationship to inactive and cancels any active subscription tied to this coach
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Active-Role
 *         schema: { type: string, enum: [client, coach] }
 *     responses:
 *       204:
 *         description: Relationship ended successfully
 *       403:
 *         description: Only clients can unhire
 *       404:
 *         description: No active coach to unhire
 *       500:
 *         description: Server error
 */
router.delete("/my-coach", auth, clientController.unhire_coach);

/**
 * @swagger
 * /api/client/my-assigned-workouts:
 *   get:
 *     summary: List workouts assigned to this client by their coach
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [assigned, completed, skipped] }
 *     responses:
 *       200:
 *         description: Paginated list of assigned workouts with coach and exercise details
 *       500:
 *         description: Server error
 */
router.get(
  "/my-assigned-workouts",
  auth,
  clientController.get_my_assigned_workouts
);

/**
 * @swagger
 * /api/client/assignments/{assignmentId}/complete:
 *   patch:
 *     summary: Mark an assigned workout as completed
 *     description: Sets status to 'completed' and notifies the coach
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Assignment marked complete (or already completed)
 *       400:
 *         description: Invalid assignment ID
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/assignments/:assignmentId/complete",
  auth,
  clientController.complete_assignment
);

/**
 * @swagger
 * /api/client/subscription:
 *   get:
 *     summary: Get the client's currently active subscription
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active subscription with coaching plan and coach info, or null if none
 *       403:
 *         description: Clients only
 *       500:
 *         description: Server error
 */
router.get("/subscription", auth, requireRole("client"), getMySubscription);

module.exports = router;
