const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const ctrl = require("../controllers/notificationController");

router.get("/", auth, ctrl.list_notifications);
router.get("/unread-count", auth, ctrl.unread_count);
router.patch("/read-all", auth, ctrl.mark_all_read);
router.patch("/:id/read", auth, ctrl.mark_read);
router.delete("/:id", auth, ctrl.delete_notification);

module.exports = router;
