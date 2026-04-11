const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const {
  send_message,
  list_conversations,
  fetch_message_history_for_person,
  list_messageable_contacts,
} = require("../controllers/messageController");

router.post("/", auth, send_message);
router.get("/conversations", auth, list_conversations);
router.get("/contacts", auth, list_messageable_contacts);

router.get("/:otherUserId", auth, fetch_message_history_for_person);

module.exports = router;
