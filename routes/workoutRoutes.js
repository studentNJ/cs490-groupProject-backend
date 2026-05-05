const express = require("express");
const auth = require("../middleware/authMiddleware");
const router = express.Router();
const workoutController = require("../controllers/workoutController");

/**
 * @swagger
 * tags:
 *   name: Workouts
 *   description: Exercise catalog and workout management
 */

/**
 * @swagger
 * /api/workout/custom:
 *   get:
 *     summary: Browse the exercise catalog with optional filters
 *     tags: [Workouts]
 *     parameters:
 *       - in: query
 *         name: muscle
 *         schema:
 *           type: string
 *         description: Filter by primary muscle group
 *         example: chest
 *       - in: query
 *         name: equipment
 *         schema:
 *           type: string
 *         description: Filter by equipment type
 *         example: barbell
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: Paginated list of exercises
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalItems:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       exercise_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       category:
 *                         type: string
 *                       equipment:
 *                         type: string
 *                       pirmary_muscles:
 *                         type: string
 *                       instructions:
 *                         type: string
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/custom", workoutController.browse_exercise);

/**
 * @swagger
 * /api/workout/premade:
 *   get:
 *     summary: Browse workouts created by the logged-in user
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of user workouts with exercises
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalItems:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       workout_id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       estimated_minutes:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/premade", auth, workoutController.browse_workout);

/**
 * @swagger
 * /api/workout/custom:
 *   post:
 *     summary: Create a custom workout with exercises
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, estimated_minutes, exercises]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Morning Strength
 *               description:
 *                 type: string
 *                 example: Full body strength routine
 *               estimated_minutes:
 *                 type: integer
 *                 example: 45
 *               exercises:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [exercise_id, sets, reps, rest]
 *                   properties:
 *                     exercise_id:
 *                       type: integer
 *                     sets:
 *                       type: integer
 *                     reps:
 *                       type: integer
 *                     rest:
 *                       type: integer
 *                       description: Rest time in seconds
 *                     notes:
 *                       type: string
 *     responses:
 *       201:
 *         description: Workout created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 workout_id:
 *                   type: integer
 *       400:
 *         description: Missing required fields or invalid exercise data
 *       401:
 *         description: Unauthorized
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/custom", auth, workoutController.create_workout);

/**
 * @swagger
 * /api/workout/premade/{id}:
 *   delete:
 *     summary: Delete a workout created by the logged-in user
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Workout ID to delete
 *     responses:
 *       200:
 *         description: Workout deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Workout not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/premade/:id", auth, workoutController.delete_workout);

module.exports = router;
