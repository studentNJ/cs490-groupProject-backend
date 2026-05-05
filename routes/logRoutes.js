const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const logController = require("../controllers/logController");

/**
 * @swagger
 * tags:
 *   name: Logs
 *   description: Workout and wellness logging
 */

/**
 * @swagger
 * /api/logs/workout-log:
 *   get:
 *     summary: Get all workout logs for the logged-in client
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs from this date
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs up to this date
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
 *         description: Paginated list of workout logs
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/workout-log", auth, logController.workout_logs);

/**
 * @swagger
 * /api/logs/workout-log:
 *   post:
 *     summary: Create a new workout log
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [workout_id, date]
 *             properties:
 *               workout_id:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               duration_minutes:
 *                 type: integer
 *               strengthLogs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     exercise_id:
 *                       type: integer
 *                     sets:
 *                       type: integer
 *                     reps:
 *                       type: integer
 *                     weight_lbs:
 *                       type: number
 *                     notes:
 *                       type: string
 *               cardioLogs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     exercise_id:
 *                       type: integer
 *                     duration_minutes:
 *                       type: integer
 *                     distance_km:
 *                       type: number
 *                     avg_herat_rate:
 *                       type: integer
 *                     notes:
 *                       type: string
 *     responses:
 *       201:
 *         description: Workout log created successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Workout not found
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/workout-log", auth, logController.create_workout_log);
router.get("/workouts/today", auth, logController.get_today_activity);
/**
 * @swagger
 * /api/logs/wellness-check:
 *   get:
 *     summary: Get all wellness logs for the logged-in client
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date
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
 *         description: Paginated list of wellness logs
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/wellness-check", auth, logController.wellness_logs);

/**
 * @swagger
 * /api/logs/wellness-check:
 *   post:
 *     summary: Create a new wellness log
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               weight:
 *                 type: number
 *               water_intake_oz:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Wellness log created
 *       400:
 *         description: Date required or log already exists for this date
 *       403:
 *         description: Only clients can log wellness data
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/wellness-check", auth, logController.create_wellness_log);

/**
 * @swagger
 * /api/logs/wellness-check/{id}:
 *   put:
 *     summary: Edit a wellness log (same-day only)
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               weight:
 *                 type: number
 *               water_intake_oz:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wellness log updated
 *       403:
 *         description: Only same-day logs are editable
 *       404:
 *         description: Log not found
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/wellness/upsert-today", auth, logController.upsert_wellness_today);

/**
 * @swagger
 * /api/logs/wellness-log/{id}:
 *   delete:
 *     summary: Delete a wellness log (same-day only)
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Wellness log deleted
 *       403:
 *         description: Only same-day logs may be deleted
 *       404:
 *         description: Log not found
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/wellness-log/:id", auth, logController.delete_wellness_log);
router.get("/wellness-check/today", auth, logController.get_today_wellness);
router.patch("/wellness/clear", auth, logController.clear_wellness_field);

//Meals
router.get("/meal-log", auth, logController.meal_logs);
router.post("/meal-log", auth, logController.create_meal_log);
router.put("/meal-log/:id", auth, logController.edit_meal_log);
router.delete("/meal-log/:id", auth, logController.delete_meal_log);
router.post("/meal-log/custom", auth, logController.create_custom_meal_log);
router.post("/calorie-target", auth, logController.set_weekly_calorie_target);

//Graphing Logged Metrics
router.get("/graph", auth, logController.get_metric);

//Daily Check-ins
router.post("/checkins/daily", auth, logController.upsert_daily_checkin);
router.get("/checkins/today", auth, logController.get_today_checkin);

// Weekly Calorie Target
router.post("/calorie-target/weekly", auth, logController.set_weekly_calorie_target);

module.exports = router;
