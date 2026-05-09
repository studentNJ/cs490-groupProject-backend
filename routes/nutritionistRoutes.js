const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const nutritionistController = require("../controllers/nutritionistController");

router.get("/", nutritionistController.browse_nutritionists);
router.get("/requests", auth, nutritionistController.get_pending_requests);
router.post("/requests/:clientUserId/approve", auth, nutritionistController.approve_request);
router.post("/requests/:clientUserId/reject", auth, nutritionistController.reject_request);
router.get("/clients", auth, nutritionistController.get_active_clients);
router.delete("/clients/:clientUserId", auth, nutritionistController.drop_client);
router.get("/my-nutritionist", auth, nutritionistController.get_my_nutritionist);
router.delete("/my-nutritionist", auth, nutritionistController.unhire_nutritionist);

router.post("/request/:nutritionistUserId", auth, nutritionistController.request_nutritionist);
router.get("/browse/:nutritionistUserId", nutritionistController.get_nutritionist);


module.exports = router;