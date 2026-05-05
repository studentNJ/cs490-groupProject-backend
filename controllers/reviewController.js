const { CoachReview, User, ClientCoachRelationship } = require("../models")
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

function getAverageRating(reviews) {
  if (reviews.length === 0) {
    return 0
  }

  const totalRating = reviews.reduce(
    (sum, review) => sum + Number(review.rating || 0),
    0,
  )

  return Number((totalRating / reviews.length).toFixed(2))
}

module.exports.submit_coach_review = async (req, res) => {
  try {
    if (getActiveRole(req) !== "client") {
      return res.status(403).json({ error: "Clients only" })
    }

    const coachUserId = parseInt(req.params.coachUserId, 10)
    const rating = Number.parseInt(req.body.rating, 10)
    const comment =
      typeof req.body.comment === "string"
        ? req.body.comment.trim()
        : null

    if (Number.isNaN(coachUserId)) {
      return res.status(400).json({ error: "Invalid coach id" })
    }

    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: "rating must be an integer from 1 to 5",
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
        error: "You can only review a coach you have worked with",
      })
    }

    const existingReview = await CoachReview.findOne({
      where: {
        coach_user_id: coachUserId,
        client_user_id: req.user.user_id,
      },
    })

    if (existingReview) {
      return res.status(409).json({
        error: "You have already reviewed this coach",
      })
    }

    const review = await CoachReview.create({
      coach_user_id: coachUserId,
      client_user_id: req.user.user_id,
      rating,
      comment: comment || null,
    })

    return res.status(201).json({
      message: "Coach review submitted successfully.",
      review,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports.list_coach_reviews = async (req, res) => {
  try {
    const coachUserId = parseInt(req.params.coachUserId, 10)
    if (Number.isNaN(coachUserId)) {
      return res.status(400).json({ error: "Invalid coach id" })
    }

    const coach = await findCoachUser(coachUserId)

    if (!coach) {
      return res.status(404).json({ error: "Coach not found" })
    }

    const reviews = await CoachReview.findAll({
      where: {
        coach_user_id: coachUserId,
      },
      include: [
        {
          model: User,
          as: "clientUser",
          attributes: ["user_id", "first_name", "last_name", "profile_pic"],
        },
      ],
      order: [["created_at", "DESC"]],
    })

    const totalReviews = reviews.length
    const averageRating = getAverageRating(reviews)

    return res.status(200).json({
      average_rating: averageRating,
      total_reviews: totalReviews,
      reviews: reviews.map((review) => ({
        review_id: review.review_id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        client: review.clientUser
          ? {
              user_id: review.clientUser.user_id,
              first_name: review.clientUser.first_name,
              last_name: review.clientUser.last_name,
              profile_pic: review.clientUser.profile_pic,
            }
          : null,
      })),
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
