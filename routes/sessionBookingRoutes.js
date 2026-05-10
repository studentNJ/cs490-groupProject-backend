const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const ctrl = require("../controllers/sessionBookingController");

/**
 * @swagger
 * tags:
 *   name: Session Bookings
 *   description: Book and view coaching sessions
 */

/**
 * @swagger
 * /api/sessions/bookings:
 *   post:
 *     summary: Book a coaching session slot
 *     tags: [Session Bookings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [coach_user_id, start_time]
 *             properties:
 *               coach_user_id: { type: integer }
 *               start_time: { type: string, format: date-time }
 *               client_notes: { type: string }
 *     responses:
 *       201: { description: Booked }
 *       400: { description: Validation error or no credits }
 *       409: { description: Slot taken or unavailable }
 */
router.post("/bookings", auth, ctrl.book_slot);

/**
 * @swagger
 * /api/sessions/bookings/upcoming:
 *   get:
 *     summary: Get my upcoming bookings (client or coach)
 *     tags: [Session Bookings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of upcoming bookings }
 */
router.get("/bookings/upcoming", auth, ctrl.list_upcoming_bookings);

/**
 * @swagger
 * /api/sessions/bookings/past:
 *   get:
 *     summary: Get my past/completed/cancelled bookings
 *     tags: [Session Bookings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of past bookings }
 */
router.get("/bookings/past", auth, ctrl.list_past_bookings);

module.exports = router;
