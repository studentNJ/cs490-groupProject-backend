const router = require("express").Router()
const auth = require("../middleware/authMiddleware")
const profileController = require("../controllers/profileController")

// Client profile

router.put("/", auth, profileController.update_client_profile)

// Coach profile
router.get("/coach", auth, profileController.get_coach_profile)
router.put("/coach", auth, profileController.update_coach_profile)

module.exports = router
