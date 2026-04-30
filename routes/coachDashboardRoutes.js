const express = require("express");
const router = express.Router();
const coachController = require("../controllers/coachController");
const auth = require("../middleware/authMiddleware");
const requireActiveCoachRelationship = require("../middleware/requireActiveCoachRelationship");

/**
 * @swagger
 * tags:
 *   name: Coach Dashboard
 *   description: Coach-side operations
 */

/**
 * @swagger
 * /api/coach/requests:
 *   get:
 *     summary: Get pending client requests
 *     tags: [Coach Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending requests
 */
router.get("/requests", auth, coachController.get_pending_requests);

/**
 * @swagger
 * /api/coach/requests/{clientUserId}/approve:
 *   post:
 *     summary: Approve a client request
 *     tags: [Coach Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientUserId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Request approved
 */
router.post(
  "/requests/:clientUserId/approve",
  auth,
  coachController.approve_request
);

/**
 * @swagger
 * /api/coach/requests/{clientUserId}/reject:
 *   post:
 *     summary: Reject a client request
 *     tags: [Coach Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/requests/:clientUserId/reject",
  auth,
  coachController.reject_request
);

/**
 * @swagger
 * /api/coach/clients:
 *   get:
 *     summary: Get active clients
 *     tags: [Coach Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get("/clients", auth, coachController.get_active_clients);

/**
 * @swagger
 * /api/coach/clients/{clientUserId}:
 *   get:
 *     summary: Get client detail
 *     tags: [Coach Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/clients/:clientUserId",
  auth,
  requireActiveCoachRelationship,
  coachController.get_client_detail
);

/**
 * @swagger
 * /api/coach/clients/{clientUserId}/workouts/logs:
 *   get:
 *     summary: Get client workout logs
 *     tags: [Coach Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/clients/:clientUserId/workouts/logs",
  auth,
  requireActiveCoachRelationship,
  coachController.get_client_workout_logs
);

/**
 * @swagger
 * /api/coach/clients/{clientUserId}/workouts/assigned:
 *   get:
 *     summary: Get assigned workouts
 *     tags: [Coach Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/clients/:clientUserId/workouts/assigned",
  auth,
  requireActiveCoachRelationship,
  coachController.get_client_assigned_workouts
);

/**
 * @swagger
 * /api/coach/clients/{clientUserId}/workouts/assign:
 *   post:
 *     summary: Assign workout to client
 *     tags: [Coach Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/clients/:clientUserId/workouts/assign",
  auth,
  requireActiveCoachRelationship,
  coachController.assign_workout
);

/**
 * @swagger
 * /api/coach/assignments/{assignmentId}:
 *   delete:
 *     summary: Unassign workout
 *     tags: [Coach Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/assignments/:assignmentId",
  auth,
  coachController.unassign_workout
);

/**
 * @swagger
 * /api/coach/clients/{clientUserId}/notes:
 *   get:
 *     summary: Get client notes
 *     tags: [Coach Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/clients/:clientUserId/notes",
  auth,
  requireActiveCoachRelationship,
  coachController.list_client_notes
);

/**
 * @swagger
 * /api/coach/clients/{clientUserId}/notes:
 *   post:
 *     summary: Create client note
 *     tags: [Coach Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/clients/:clientUserId/notes",
  auth,
  requireActiveCoachRelationship,
  coachController.create_client_note
);

/**
 * @swagger
 * /api/coach/notes/{noteId}:
 *   patch:
 *     summary: Update note
 *     tags: [Coach Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.patch("/notes/:noteId", auth, coachController.update_note);

/**
 * @swagger
 * /api/coach/notes/{noteId}:
 *   delete:
 *     summary: Delete note
 *     tags: [Coach Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/notes/:noteId", auth, coachController.delete_note);

/**
 * @swagger
 * /api/coach/clients/{clientUserId}:
 *   delete:
 *     summary: Drop client
 *     tags: [Coach Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/clients/:clientUserId", auth, coachController.drop_client);

module.exports = router;
