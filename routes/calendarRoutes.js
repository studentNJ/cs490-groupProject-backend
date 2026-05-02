"use strict"

const router = require("express").Router()
const auth = require("../middleware/authMiddleware")
const calendarController = require("../controllers/calendarController")

router.get("/", auth, calendarController.get_events)
router.post("/", auth, calendarController.create_event)
router.delete("/:id", auth, calendarController.delete_event)

module.exports = router
