const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const { submit_client_survey } = require("../controllers/surveyController");

router.post("/client", authMiddleware, submit_client_survey);

module.exports = router;
