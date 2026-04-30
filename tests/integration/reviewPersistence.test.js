const test = require("node:test")
const assert = require("node:assert/strict")
const express = require("express")
const request = require("supertest")
const jwt = require("jsonwebtoken")
const { DataTypes } = require("sequelize")

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret"

const {
  sequelize,
  User,
  Client,
  Coach,
  CoachReport,
  CoachReview,
  ClientCoachRelationship,
} = require("../../models")

const coachRoutes = require("../../routes/coachRoutes")

const buildApp = () => {
  const app = express()
  app.use(express.json())
  app.use("/api/coaches", coachRoutes)
  return app
}

const authHeader = (payload) =>
  `Bearer ${jwt.sign(payload, process.env.JWT_SECRET)}`

const buildClientToken = (userId) =>
  authHeader({ user_id: userId, role: "client" })

const setForeignKeyChecks = (enabled) =>
  sequelize.query(`SET FOREIGN_KEY_CHECKS = ${enabled ? 1 : 0}`)

const createUser = async (overrides) => {
  return User.create({
    first_name: "Test",
    last_name: "User",
    username: `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    email: `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@example.com`,
    password_hash: "hash",
    role: "client",
    ...overrides,
  })
}

test.before(async () => {
  await sequelize.authenticate()

  const queryInterface = sequelize.getQueryInterface()
  const userColumns = await queryInterface.describeTable("users")

  if (!userColumns.google_id) {
    await queryInterface.addColumn("users", "google_id", {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    })
  }

  const [tables] = await sequelize.query("SHOW TABLES")
  const tableNames = new Set(tables.map((row) => Object.values(row)[0]))

  if (tableNames.has("Client") && !tableNames.has("client")) {
    await queryInterface.dropTable("Client")
    tableNames.delete("Client")
  }

  if (!tableNames.has("client")) {
    await Client.sync()
    tableNames.add("client")
  }

  if (!tableNames.has("client_coach_relationship")) {
    await ClientCoachRelationship.sync()
    tableNames.add("client_coach_relationship")
  }

  if (!tableNames.has("coach_review")) {
    await CoachReview.sync()
  }
})

test.beforeEach(async () => {
  await setForeignKeyChecks(false)
  await CoachReview.destroy({ where: {} })
  await CoachReport.destroy({ where: {} })
  await ClientCoachRelationship.destroy({ where: {} })
  await Client.destroy({ where: {} })
  await Coach.destroy({ where: {} })
  await User.destroy({ where: {} })
  await setForeignKeyChecks(true)
})

test.after(async () => {
  await sequelize.close()
})

test("Coach report submission persists in the test database", async () => {
  const app = buildApp()
  const clientUser = await createUser({ role: "client" })
  const coachUser = await createUser({ role: "coach" })

  await Client.create({ user_id: clientUser.user_id })
  await Coach.create({ user_id: coachUser.user_id, price: 49.99 })
  await ClientCoachRelationship.create({
    client_user_id: clientUser.user_id,
    coach_user_id: coachUser.user_id,
    status: "active",
    start_date: "2026-04-01",
    requested_at: new Date(),
    responded_at: new Date(),
  })

  const response = await request(app)
    .post(`/api/coaches/${coachUser.user_id}/report`)
    .set("Authorization", buildClientToken(clientUser.user_id))
    .send({
      category: "quality_of_service",
      title: "Missed check-ins",
      description: "Coach repeatedly skipped agreed check-ins.",
      severity: "high",
    })

  assert.equal(response.status, 201)

  const persistedReport = await CoachReport.findByPk(
    response.body.report.report_id,
  )

  assert.ok(persistedReport)
  assert.equal(persistedReport.reporter_user_id, clientUser.user_id)
  assert.equal(persistedReport.coach_user_id, coachUser.user_id)
  assert.equal(persistedReport.category, "quality_of_service")
  assert.equal(persistedReport.status, "open")
})

test("Coach review submission persists and is returned by the reviews endpoint", async () => {
  const app = buildApp()
  const clientUser = await createUser({ role: "client" })
  const coachUser = await createUser({ role: "coach" })

  await Client.create({ user_id: clientUser.user_id })
  await Coach.create({ user_id: coachUser.user_id, price: 59.99 })
  await ClientCoachRelationship.create({
    client_user_id: clientUser.user_id,
    coach_user_id: coachUser.user_id,
    status: "inactive",
    start_date: "2026-03-01",
    end_date: "2026-04-01",
    requested_at: new Date("2026-03-01T00:00:00Z"),
    responded_at: new Date("2026-03-02T00:00:00Z"),
  })

  const submitResponse = await request(app)
    .post(`/api/coaches/${coachUser.user_id}/review`)
    .set("Authorization", buildClientToken(clientUser.user_id))
    .send({
      rating: 5,
      comment: "Very helpful and consistent coaching.",
    })

  assert.equal(submitResponse.status, 201)

  const persistedReview = await CoachReview.findByPk(
    submitResponse.body.review.review_id,
  )

  assert.ok(persistedReview)
  assert.equal(persistedReview.client_user_id, clientUser.user_id)
  assert.equal(persistedReview.coach_user_id, coachUser.user_id)
  assert.equal(persistedReview.rating, 5)
  assert.equal(persistedReview.comment, "Very helpful and consistent coaching.")

  const listResponse = await request(app)
    .get(`/api/coaches/${coachUser.user_id}/reviews`)
    .set("Authorization", buildClientToken(clientUser.user_id))

  assert.equal(listResponse.status, 200)
  assert.equal(listResponse.body.total_reviews, 1)
  assert.equal(listResponse.body.average_rating, 5)
  assert.equal(listResponse.body.reviews[0].review_id, persistedReview.review_id)
})
