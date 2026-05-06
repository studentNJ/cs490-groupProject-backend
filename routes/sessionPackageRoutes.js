const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const ctrl = require("../controllers/sessionPackageController");

/**
 * @swagger
 * tags:
 *   name: Session Packages
 *   description: Coach-defined session bundles
 */

/**
 * @swagger
 * /api/coach/packages:
 *   get:
 *     summary: List the logged-in coach's packages
 *     tags: [Session Packages]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of packages }
 *       403: { description: Coaches only }
 */
router.get("/", auth, ctrl.list_my_packages);

/**
 * @swagger
 * /api/coach/packages:
 *   post:
 *     summary: Create a new package
 *     tags: [Session Packages]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, session_count]
 *             properties:
 *               name: { type: string, maxLength: 100 }
 *               session_count: { type: integer, minimum: 1 }
 *               discount_percent: { type: number, minimum: 0, maximum: 100 }
 *     responses:
 *       201: { description: Package created }
 *       400: { description: Validation failed or coach has no hourly rate }
 *       403: { description: Coaches only }
 */
router.post("/", auth, ctrl.create_package);

/**
 * @swagger
 * /api/coach/packages/{packageId}:
 *   patch:
 *     summary: Update a package
 *     tags: [Session Packages]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: packageId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Package updated }
 *       404: { description: Not found }
 */
router.patch("/:packageId", auth, ctrl.update_package);

/**
 * @swagger
 * /api/coach/packages/{packageId}:
 *   delete:
 *     summary: Deactivate (soft-delete) a package
 *     tags: [Session Packages]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: packageId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Package deactivated }
 */
router.delete("/:packageId", auth, ctrl.deactivate_package);

module.exports = router;
