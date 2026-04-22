const router = require("express").Router()
const auth = require("../middleware/authMiddleware")
const { submit_client_survey } = require("../controllers/surveyController")

router.post("/client", auth, submit_client_survey)

module.exports = router
