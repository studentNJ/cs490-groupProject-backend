const { Router } = require("express");
const adminController = require("../controllers/adminController");
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");

const router = Router();

router.use(auth, requireRole("admin"));

router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id/status", adminController.setUserStatus);
router.put("/users/:id/role", adminController.changeUserRole);
router.put("/users/:id/approve", adminController.approveRegistration);
router.delete("/users/:id", adminController.deleteUser);
router.get("/stats", adminController.getStats);
router.get("/pending", adminController.getPendingApprovals);

module.exports = router;