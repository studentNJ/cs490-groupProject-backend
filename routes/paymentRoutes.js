const { Router } = require("express")
const auth = require("../middleware/authMiddleware")
const requireRole = require("../middleware/requireRole")
const paymentController = require("../controllers/paymentController")

const router = Router()

router.post("/", auth, paymentController.process_payment)
router.get("/history", auth, paymentController.get_payment_history)
router.get("/earnings", auth, paymentController.get_coach_earnings)
router.get(
  "/stats",
  auth,
  requireRole("admin"),
  paymentController.get_payment_stats,
)

module.exports = router
