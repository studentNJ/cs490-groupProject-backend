const { Router } = require("express");
const authController = require("../controllers/authController.js");
const auth = require("../middleware/authMiddleware");
const googleAuthController = require("../controllers/googleAuthController");
const upload = require("../middleware/documentUpload");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         token:
 *           type: string
 *         user:
 *           type: object
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         error:
 *           type: string
 */

const router = Router();

// -- Public Routes --
/**
 * @swagger
 * /auth/register/client:
 *   post:
 *     summary: Register a new client
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - password
 *             properties:
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AuthResponse"
 *       409:
 *         description: Duplicate user
 *       500:
 *         description: Server error
 */
router.post("/register/client", authController.register_client_post);

/**
 * @swagger
 * /auth/register/coach:
 *   post:
 *     summary: Register a new coach
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               phone: { type: string }
 *               specialization: { type: string }
 *               price: { type: number }
 *               certification:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AuthResponse"
 *       409:
 *         description: Duplicate user
 */
router.post(
  "/register/coach",
  upload.array("certification", 5),
  authController.register_coach_post
);

/**
 * @swagger
 * /auth/register/nutritionist:
 *   post:
 *     summary: Register nutritionist
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               phone: { type: string }
 *               price: { type: number }
 *     responses:
 *       201:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AuthResponse"
 *       409:
 *         description: Duplicate user
 */
router.post(
  "/register/nutritionist",
  authController.register_nutritionist_post
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AuthResponse"
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 */
router.post("/login", authController.login_post);

// -- Google OAuth --
/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Google OAuth redirect
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect
 */
router.get("/google", googleAuthController.google_redirect);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/google/callback", googleAuthController.google_callback);

// -- Protected Routes --
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */
router.get("/me", auth, authController.me_get);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post("/logout", auth, authController.logout_post);
/**
 * @swagger
 * /auth/delete-account:
 *   post:
 *     summary: Deactivate account
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deactivated
 */
router.post("/delete-account", auth, authController.delete_account_post);

/**
 * @swagger
 * /auth/delete-all-data:
 *   post:
 *     summary: Permanently delete account
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *       401:
 *         description: Wrong password
 */
router.post("/delete-all-data", auth, authController.delete_all_data_post);

module.exports = router;
