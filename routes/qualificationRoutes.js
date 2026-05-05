const express = require("express");
const router = express.Router();
const qualificationController = require("../controllers/qualController");
const auth = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Qualifications
 *   description: Coach qualification management
 */

/**
 * @swagger
 * /api/qualifications:
 *   post:
 *     summary: Add a qualification to the logged-in coach's profile
 *     tags: [Qualifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [degree_name, institution, field_of_study, year_completed]
 *             properties:
 *               degree_name:
 *                 type: string
 *                 example: Bachelor of Science
 *               institution:
 *                 type: string
 *                 example: NJIT
 *               field_of_study:
 *                 type: string
 *                 example: Exercise Science
 *               year_completed:
 *                 type: integer
 *                 example: 2020
 *     responses:
 *       201:
 *         description: Qualification added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 qualification:
 *                   type: object
 *       404:
 *         description: All information must be submitted
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", auth, qualificationController.add_qualification);

/**
 * @swagger
 * /api/qualifications:
 *   get:
 *     summary: Get all qualifications for the logged-in coach
 *     tags: [Qualifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of qualifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   coach_id:
 *                     type: integer
 *                   degree_name:
 *                     type: string
 *                   institution:
 *                     type: string
 *                   field_of_study:
 *                     type: string
 *                   year_completed:
 *                     type: integer
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", auth, qualificationController.get_qualification);

/**
 * @swagger
 * /api/qualifications/{id}:
 *   delete:
 *     summary: Delete a qualification by ID
 *     tags: [Qualifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Qualification ID to delete
 *     responses:
 *       200:
 *         description: Qualification deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", auth, qualificationController.delete_qualification);

module.exports = router;
