const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { submit_client_survey } = require("../controllers/surveyController");

/**
 * @swagger
 * tags:
 *   name: Survey
 *   description: Client onboarding survey
 */

/**
 * @swagger
 * /api/survey/client:
 *   post:
 *     summary: Submit the client onboarding survey
 *     tags: [Survey]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               goal:
 *                 type: string
 *                 description: Primary fitness goal
 *                 example: Lose weight
 *               typeWorkout:
 *                 type: string
 *                 description: Preferred workout type
 *                 example: Strength training
 *               dietPreference:
 *                 type: string
 *                 description: Dietary preference
 *                 example: Vegan
 *               currentActivity:
 *                 type: string
 *                 description: Current activity level
 *                 example: Sedentary
 *               coachHelp:
 *                 type: string
 *                 description: What the client wants from a coach
 *                 example: Accountability and workout plans
 *               nutritionistHelp:
 *                 type: string
 *                 description: What the client wants from a nutritionist
 *                 example: Meal planning
 *               workoutDay:
 *                 type: integer
 *                 description: Number of workout days per week
 *                 example: 4
 *     responses:
 *       201:
 *         description: Survey submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 client:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                     goal:
 *                       type: string
 *                     type_workout:
 *                       type: string
 *                     diet_preference:
 *                       type: string
 *                     current_activity:
 *                       type: string
 *                     coach_help:
 *                       type: string
 *                     nutritionist_help:
 *                       type: string
 *                     workout_day:
 *                       type: integer
 *                     survey_completed:
 *                       type: boolean
 *       400:
 *         description: workoutDay must be a number
 *       404:
 *         description: Client not found
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/client", auth, submit_client_survey);

module.exports = router;
