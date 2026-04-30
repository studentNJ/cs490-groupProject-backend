const test = require("node:test")
const assert = require("node:assert/strict")
const express = require("express")
const request = require("supertest")
const jwt = require("jsonwebtoken")

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret"

const models = require("../models")
const coachRoutes = require("../routes/coachRoutes")

const { CoachReport, CoachReview, User, ClientCoachRelationship } = models

const originalMethods = {
  coachReportCreate: CoachReport.create,
  coachReviewCreate: CoachReview.create,
  coachReviewFindOne: CoachReview.findOne,
  coachReviewFindAll: CoachReview.findAll,
  userFindOne: User.findOne,
  relationshipFindOne: ClientCoachRelationship.findOne,
}

const buildApp = () => {
  const app = express()
  app.use(express.json())
  app.use("/api/coaches", coachRoutes)
  return app
}

const authHeader = (payload) =>
  `Bearer ${jwt.sign(payload, process.env.JWT_SECRET)}`

const buildClientToken = (userId = 11) =>
  authHeader({ user_id: userId, role: "client" })

test.afterEach(() => {
  CoachReport.create = originalMethods.coachReportCreate
  CoachReview.create = originalMethods.coachReviewCreate
  CoachReview.findOne = originalMethods.coachReviewFindOne
  CoachReview.findAll = originalMethods.coachReviewFindAll
  User.findOne = originalMethods.userFindOne
  ClientCoachRelationship.findOne = originalMethods.relationshipFindOne
})

test("POST /api/coaches/:coachUserId/report submits a coach report", async () => {
  const app = buildApp()

  User.findOne = async () => ({ user_id: 7, role: "coach", is_active: true })
  ClientCoachRelationship.findOne = async () => ({
    client_user_id: 11,
    coach_user_id: 7,
    status: "active",
  })
  CoachReport.create = async (payload) => ({ report_id: 55, ...payload })

  const response = await request(app)
    .post("/api/coaches/7/report")
    .set("Authorization", buildClientToken())
    .send({
      category: "quality_of_service",
      title: "Missed sessions",
      description: "Coach repeatedly missed scheduled sessions.",
      severity: "high",
    })

  assert.equal(response.status, 201)
  assert.equal(response.body.report.report_id, 55)
  assert.equal(response.body.report.coach_user_id, 7)
})

test("POST /api/coaches/:coachUserId/report rejects clients without relationship", async () => {
  const app = buildApp()

  User.findOne = async () => ({ user_id: 7, role: "coach", is_active: true })
  ClientCoachRelationship.findOne = async () => null

  const response = await request(app)
    .post("/api/coaches/7/report")
    .set("Authorization", buildClientToken())
    .send({
      category: "other",
      title: "Issue",
      description: "No relationship should block this.",
    })

  assert.equal(response.status, 403)
  assert.match(response.body.error, /worked with/i)
})

test("POST /api/coaches/:coachUserId/review submits combined rating and review", async () => {
  const app = buildApp()

  User.findOne = async () => ({ user_id: 7, role: "coach", is_active: true })
  ClientCoachRelationship.findOne = async () => ({
    client_user_id: 11,
    coach_user_id: 7,
    status: "inactive",
  })
  CoachReview.findOne = async () => null
  CoachReview.create = async (payload) => ({ review_id: 22, ...payload })

  const response = await request(app)
    .post("/api/coaches/7/review")
    .set("Authorization", buildClientToken())
    .send({ rating: 5, comment: "Very helpful coach." })

  assert.equal(response.status, 201)
  assert.equal(response.body.review.review_id, 22)
  assert.equal(response.body.review.rating, 5)
})

test("POST /api/coaches/:coachUserId/review rejects duplicate reviews", async () => {
  const app = buildApp()

  User.findOne = async () => ({ user_id: 7, role: "coach", is_active: true })
  ClientCoachRelationship.findOne = async () => ({
    client_user_id: 11,
    coach_user_id: 7,
    status: "active",
  })
  CoachReview.findOne = async () => ({ review_id: 1 })

  const response = await request(app)
    .post("/api/coaches/7/review")
    .set("Authorization", buildClientToken())
    .send({ rating: 4, comment: "Second review attempt." })

  assert.equal(response.status, 409)
  assert.match(response.body.error, /already reviewed/i)
})

test("GET /api/coaches/:coachUserId/reviews returns summary and review items", async () => {
  const app = buildApp()

  User.findOne = async () => ({ user_id: 7, role: "coach", is_active: true })
  CoachReview.findAll = async () => [
    {
      review_id: 1,
      rating: 5,
      comment: "Excellent",
      created_at: "2026-04-30T00:00:00.000Z",
      clientUser: {
        user_id: 11,
        first_name: "Ava",
        last_name: "Client",
        profile_pic: null,
      },
    },
    {
      review_id: 2,
      rating: 3,
      comment: "Okay",
      created_at: "2026-04-29T00:00:00.000Z",
      clientUser: {
        user_id: 12,
        first_name: "Ben",
        last_name: "Client",
        profile_pic: null,
      },
    },
  ]

  const response = await request(app)
    .get("/api/coaches/7/reviews")
    .set("Authorization", buildClientToken())

  assert.equal(response.status, 200)
  assert.equal(response.body.total_reviews, 2)
  assert.equal(response.body.average_rating, 4)
  assert.equal(response.body.reviews.length, 2)
  assert.equal(response.body.reviews[0].client.first_name, "Ava")
})

test("POST /api/coaches/:coachUserId/review rejects non-client callers", async () => {
  const app = buildApp()

  const response = await request(app)
    .post("/api/coaches/7/review")
    .set("Authorization", authHeader({ user_id: 7, role: "coach" }))
    .send({ rating: 5, comment: "Invalid caller" })

  assert.equal(response.status, 403)
  assert.equal(response.body.error, "Clients only")
})
