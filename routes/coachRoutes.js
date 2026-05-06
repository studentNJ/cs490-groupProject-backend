const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const coachController = require("../controllers/coachController");
const reportController = require("../controllers/reportController");
const reviewController = require("../controllers/reviewController");
const { getCoachPlans } = require("../controllers/subscriptionController.js");
const sessionPackageController = require("../controllers/sessionPackageController");
const availabilityController = require("../controllers/availabilityController");

/**
 * @swagger
 * tags:
 *   name: Coaches
 *   description: Coach related endpoints
 */

/**
 * @swagger
 * /api/coaches:
 *   get:
 *     summary: Browse coaches
 *     tags: [Coaches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 12
 *     responses:
 *       200:
 *         description: List of coaches
 */
router.get("/", auth, coachController.browse_coaches);

/**
 * @swagger
 * /api/coaches/request:
 *   delete:
 *     summary: Cancel coach request
 *     tags: [Coaches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Request cancelled
 *       404:
 *         description: No pending request
 */
router.delete("/request", auth, coachController.cancel_request);

/**
 * @swagger
 * /api/coaches/{userId}/plans:
 *   get:
 *     summary: Get coach subscription plans
 *     tags: [Coaches]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Coach plans retrieved
 */
router.get("/:userId/plans", getCoachPlans);

/**
 * @swagger
 * /api/coaches/{coachUserId}:
 *   get:
 *     summary: Get coach detail
 *     tags: [Coaches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coachUserId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Coach detail
 *       404:
 *         description: Coach not found
 */
router.get("/:coachUserId", auth, coachController.get_coach);

/**
 * @swagger
 * /api/coaches/{coachUserId}/request:
 *   post:
 *     summary: Request a coach
 *     tags: [Coaches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coachUserId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Request sent
 *       403:
 *         description: Only clients allowed
 *       404:
 *         description: Coach not found
 */
router.post("/:coachUserId/request", auth, coachController.request_coach);

router.get(
  "/:coachUserId/packages",
  sessionPackageController.list_coach_packages_public
);

router.get(
  "/:coachUserId/availability",
  availabilityController.list_coach_slots_public
);
module.exports = router;
