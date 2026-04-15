const router = require("express").Router();
const auth = require("../middleware/authMiddleware");

const coachController = require("../controllers/coachController");

router.get("/my-coach", auth, coachController.get_my_coach);

module.exports = router;
