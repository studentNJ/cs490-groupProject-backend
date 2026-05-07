const express = require("express");
const router = express.Router();
const certificationController = require("../controllers/certController");

const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/documentUpload");
const requireRole = require("../middleware/requireRole");

/**
 * @swagger
 * /api/certifications:
 *   post:
 *     summary: Submit a certification for review
 *     tags: [Certifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Certification submitted successfully
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  auth,
  upload.single("document"),
  certificationController.add_certification
);

/**
 * @swagger
 * /api/certifications/{id}/verify:
 *   post:
 *     summary: Verify or reject a certification
 *     tags: [Certifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: approved
 *     responses:
 *       200:
 *         description: Certification status updated
 *       500:
 *         description: Server error
 */
router.post(
  "/:id/verify",
  auth,
  requireRole("admin"),
  certificationController.verify_certification
);
/**
 * @swagger
 * /api/certifications:
 *   get:
 *     summary: Get all certifications of logged-in user
 *     tags: [Certifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of certifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Server error
 */
router.get("/", auth, certificationController.get_certification);
router.delete("/:id", auth, certificationController.delete_certification);
module.exports = router;
