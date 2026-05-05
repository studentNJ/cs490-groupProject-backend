const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const ctrl = require("../controllers/progressPhotoController");

/**
 * @swagger
 * tags:
 *   name: ProgressPhotos
 *   description: Before/after progress photos for tracking client transformation
 */

/**
 * @swagger
 * /api/photos:
 *   post:
 *     summary: Upload a progress photo
 *     description: Stores a base64-encoded image with optional caption and date
 *     tags: [ProgressPhotos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [image_data]
 *             properties:
 *               image_data:
 *                 type: string
 *                 description: Base64-encoded image, with or without data URL prefix
 *               caption:
 *                 type: string
 *               taken_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Photo uploaded
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post("/", auth, ctrl.upload_photo);

/**
 * @swagger
 * /api/photos:
 *   get:
 *     summary: List the current user's progress photos
 *     tags: [ProgressPhotos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of photos, newest first
 *       500:
 *         description: Server error
 */
router.get("/", auth, ctrl.list_photos);

/**
 * @swagger
 * /api/photos/{photoId}:
 *   delete:
 *     summary: Delete one of the current user's progress photos
 *     tags: [ProgressPhotos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 *       400:
 *         description: Invalid id
 *       404:
 *         description: Photo not found
 *       500:
 *         description: Server error
 */
router.delete("/:photoId", auth, ctrl.delete_photo);

module.exports = router;
