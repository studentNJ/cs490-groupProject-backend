"use strict"

const db = require("../models")
const CalendarEvent = db.CalendarEvent

module.exports.get_events = async (req, res) => {
  try {
    const userId = req.user.user_id

    const events = await CalendarEvent.findAll({
      where: { user_id: userId },
      order: [["date", "ASC"]],
    })

    return res.status(200).json({ data: events })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports.create_event = async (req, res) => {
  try {
    const userId = req.user.user_id
    const { date, text, color } = req.body

    if (!date || !text) {
      return res.status(400).json({ error: "Date and text are required" })
    }

    const event = await CalendarEvent.create({
      user_id: userId,
      date,
      text,
      color: color || "#6ca6ff",
    })

    return res.status(201).json({ data: event })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports.delete_event = async (req, res) => {
  try {
    const userId = req.user.user_id
    const { id } = req.params

    const event = await CalendarEvent.findOne({
      where: { calendar_event_id: id, user_id: userId },
    })

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    await event.destroy()

    return res.status(200).json({ message: "Event deleted successfully" })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
