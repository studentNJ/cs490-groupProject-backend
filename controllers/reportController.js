const { CoachReport, User, ClientCoachRelationship } = require("../models")
const { Op } = require("sequelize")

function getActiveRole(req) {
  return req.headers["x-active-role"] || req.user.role
}

function findEligibleRelationship(clientUserId, coachUserId) {
  return ClientCoachRelationship.findOne({
    where: {
      client_user_id: clientUserId,
      coach_user_id: coachUserId,
      status: {
        [Op.in]: ["active", "inactive"],
      },
    },
  })
}

function findCoachUser(coachUserId) {
  return User.findOne({
    where: {
      user_id: coachUserId,
      role: "coach",
      is_active: true,
    },
  })
}

module.exports.submit_coach_report = async (req, res) => {
  try {
    if (getActiveRole(req) !== "client") {
      return res.status(403).json({ error: "Clients only" })
    }

    const coachUserId = parseInt(req.params.coachUserId, 10)
    if (Number.isNaN(coachUserId)) {
      return res.status(400).json({ error: "Invalid coach id" })
    }

    const { category, title, description, severity } = req.body
    if (!category || !title || !description) {
      return res.status(400).json({
        error: "category, title, and description are required",
      })
    }

    const coach = await findCoachUser(coachUserId)

    if (!coach) {
      return res.status(404).json({ error: "Coach not found" })
    }

    const relationship = await findEligibleRelationship(
      req.user.user_id,
      coachUserId,
    )

    if (!relationship) {
      return res.status(403).json({
        error: "You can only report a coach you have worked with",
      })
    }

    const report = await CoachReport.create({
      reporter_user_id: req.user.user_id,
      coach_user_id: coachUserId,
      category,
      title: title.trim(),
      description: description.trim(),
      severity: severity || "medium",
    })

    return res.status(201).json({
      message: "Coach report submitted successfully.",
      report,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
