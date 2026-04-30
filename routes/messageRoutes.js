const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const {
  send_message,
  list_conversations,
  fetch_message_history_for_person,
  list_messageable_contacts,
} = require("../controllers/messageController");

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Direct messaging between clients, coaches, and nutritionists
 */

/**
 * @swagger
 * /message:
 *   post:
 *     summary: Send a message to another user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to_id, message_content]
 *             properties:
 *               to_id:
 *                 type: integer
 *                 description: User ID of the recipient
 *               message_content:
 *                 type: string
 *                 maxLength: 5000
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid input or empty message
 *       403:
 *         description: Not allowed to message this user
 *       404:
 *         description: Recipient not found
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", auth, send_message);

/**
 * @swagger
 * /message/conversations:
 *   get:
 *     summary: List all conversations for the logged-in user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations with preview and unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       preview:
 *                         type: string
 *                       lastMessageAt:
 *                         type: string
 *                         format: date-time
 *                       profilePic:
 *                         type: string
 *                       unreadCount:
 *                         type: integer
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/conversations", auth, list_conversations);

/**
 * @swagger
 * /message/contacts:
 *   get:
 *     summary: List users the logged-in user is allowed to message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of messageable contacts based on active relationships
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contacts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: integer
 *                       first_name:
 *                         type: string
 *                       last_name:
 *                         type: string
 *                       profile_pic:
 *                         type: string
 *                       role:
 *                         type: string
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/contacts", auth, list_messageable_contacts);

/**
 * @swagger
 * /message/{otherUserId}:
 *   get:
 *     summary: Fetch full message history with a specific user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: otherUserId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID of the other person in the conversation
 *     responses:
 *       200:
 *         description: List of messages ordered oldest to newest. Marks unread messages as read.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       message_id:
 *                         type: integer
 *                       from_id:
 *                         type: integer
 *                       to_id:
 *                         type: integer
 *                       message_content:
 *                         type: string
 *                       is_read:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid user ID or attempting to fetch conversation with yourself
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:otherUserId", auth, fetch_message_history_for_person);

module.exports = router;
