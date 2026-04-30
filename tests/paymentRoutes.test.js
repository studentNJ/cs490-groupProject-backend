const test = require("node:test")
const assert = require("node:assert/strict")
const express = require("express")
const request = require("supertest")
const jwt = require("jsonwebtoken")

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret"

const models = require("../models")
const paymentRoutes = require("../routes/paymentRoutes")
const clientRoutes = require("../routes/clientRoutes")

const { Payment, Subscription, Coach, ClientCoachRelationship } = models

const originalMethods = {
  paymentCreate: Payment.create,
  paymentFindAll: Payment.findAll,
  paymentSum: Payment.sum,
  paymentCount: Payment.count,
  paymentTransaction: Payment.sequelize.transaction,
  subscriptionFindOne: Subscription.findOne,
  subscriptionCreate: Subscription.create,
  subscriptionUpdate: Subscription.update,
  coachFindByPk: Coach.findByPk,
  relationshipFindOne: ClientCoachRelationship.findOne,
  relationshipTransaction: ClientCoachRelationship.sequelize.transaction,
}

const buildApp = () => {
  const app = express()
  app.use(express.json())
  app.use("/api/payments", paymentRoutes)
  app.use("/api/client", clientRoutes)
  return app
}

const authHeader = (payload) =>
  `Bearer ${jwt.sign(payload, process.env.JWT_SECRET)}`

const createTransaction = () => {
  const state = { commits: 0, rollbacks: 0 }

  return {
    state,
    async commit() {
      state.commits += 1
    },
    async rollback() {
      state.rollbacks += 1
    },
  }
}

test.afterEach(() => {
  Payment.create = originalMethods.paymentCreate
  Payment.findAll = originalMethods.paymentFindAll
  Payment.sum = originalMethods.paymentSum
  Payment.count = originalMethods.paymentCount
  Payment.sequelize.transaction = originalMethods.paymentTransaction
  Subscription.findOne = originalMethods.subscriptionFindOne
  Subscription.create = originalMethods.subscriptionCreate
  Subscription.update = originalMethods.subscriptionUpdate
  Coach.findByPk = originalMethods.coachFindByPk
  ClientCoachRelationship.findOne = originalMethods.relationshipFindOne
  ClientCoachRelationship.sequelize.transaction =
    originalMethods.relationshipTransaction
})

test("POST /api/payments records a payment and subscription", async () => {
  const app = buildApp()
  const transaction = createTransaction()

  Payment.sequelize.transaction = async () => transaction
  ClientCoachRelationship.findOne = async () => ({
    client_user_id: 11,
    coach_user_id: 7,
    status: "active",
  })
  Coach.findByPk = async () => ({ user_id: 7, price: "49.99" })
  Payment.create = async (payload) => ({ payment_id: 100, ...payload })
  Subscription.findOne = async () => null
  Subscription.create = async (payload) => ({ subscription_id: 200, ...payload })

  const response = await request(app)
    .post("/api/payments")
    .set("Authorization", authHeader({ user_id: 11, role: "client" }))
    .send({ coach_id: 7, payment_method: "card" })

  assert.equal(response.status, 201)
  assert.equal(response.body.message, "Payment recorded successfully.")
  assert.equal(response.body.payment.coach_id, 7)
  assert.equal(response.body.subscription.status, "active")
  assert.equal(transaction.state.commits, 1)
  assert.equal(transaction.state.rollbacks, 0)
})

test("POST /api/payments rejects requests without an active relationship", async () => {
  const app = buildApp()
  const transaction = createTransaction()

  Payment.sequelize.transaction = async () => transaction
  ClientCoachRelationship.findOne = async () => null

  const response = await request(app)
    .post("/api/payments")
    .set("Authorization", authHeader({ user_id: 11, role: "client" }))
    .send({ coach_id: 7 })

  assert.equal(response.status, 400)
  assert.match(response.body.error, /active client-coach relationship/i)
  assert.equal(transaction.state.commits, 0)
  assert.equal(transaction.state.rollbacks, 1)
})

test("POST /api/payments rejects non-client callers", async () => {
  const app = buildApp()
  const transaction = createTransaction()

  Payment.sequelize.transaction = async () => transaction

  const response = await request(app)
    .post("/api/payments")
    .set("Authorization", authHeader({ user_id: 7, role: "coach" }))
    .send({ coach_id: 7 })

  assert.equal(response.status, 403)
  assert.equal(response.body.error, "Clients only")
  assert.equal(transaction.state.rollbacks, 1)
})

test("POST /api/payments rejects coaches without a configured price", async () => {
  const app = buildApp()
  const transaction = createTransaction()

  Payment.sequelize.transaction = async () => transaction
  ClientCoachRelationship.findOne = async () => ({
    client_user_id: 11,
    coach_user_id: 7,
    status: "active",
  })
  Coach.findByPk = async () => ({ user_id: 7, price: null })

  const response = await request(app)
    .post("/api/payments")
    .set("Authorization", authHeader({ user_id: 11, role: "client" }))
    .send({ coach_id: 7 })

  assert.equal(response.status, 400)
  assert.equal(response.body.error, "Coach price is not set")
  assert.equal(transaction.state.rollbacks, 1)
})

test("GET /api/payments/history returns client payment history", async () => {
  const app = buildApp()

  Payment.findAll = async () => [
    {
      payment_id: 1,
      payment_amount: "49.99",
      payment_status: "completed",
    },
  ]

  const response = await request(app)
    .get("/api/payments/history")
    .set("Authorization", authHeader({ user_id: 11, role: "client" }))

  assert.equal(response.status, 200)
  assert.equal(response.body.payments.length, 1)
  assert.equal(response.body.payments[0].payment_id, 1)
})

test("GET /api/payments/history rejects non-client callers", async () => {
  const app = buildApp()

  const response = await request(app)
    .get("/api/payments/history")
    .set("Authorization", authHeader({ user_id: 7, role: "coach" }))

  assert.equal(response.status, 403)
  assert.equal(response.body.error, "Clients only")
})

test("GET /api/payments/earnings returns coach earnings summary", async () => {
  const app = buildApp()

  Payment.sum = async () => "149.97"
  Payment.count = async () => 3
  Payment.findAll = async () => [{ payment_id: 3 }, { payment_id: 2 }]

  const response = await request(app)
    .get("/api/payments/earnings")
    .set("Authorization", authHeader({ user_id: 7, role: "coach" }))

  assert.equal(response.status, 200)
  assert.equal(response.body.total_earnings, 149.97)
  assert.equal(response.body.total_payments, 3)
  assert.equal(response.body.recent_payments.length, 2)
})

test("GET /api/payments/earnings rejects non-coach callers", async () => {
  const app = buildApp()

  const response = await request(app)
    .get("/api/payments/earnings")
    .set("Authorization", authHeader({ user_id: 11, role: "client" }))

  assert.equal(response.status, 403)
  assert.equal(response.body.error, "Coaches only")
})

test("GET /api/payments/stats returns admin payment stats", async () => {
  const app = buildApp()

  Payment.sum = async () => "249.95"
  Payment.count = async () => 5
  Payment.findAll = async () => [
    { payment_status: "completed", count: "4" },
    { payment_status: "failed", count: "1" },
  ]

  const response = await request(app)
    .get("/api/payments/stats")
    .set("Authorization", authHeader({ user_id: 1, role: "admin" }))

  assert.equal(response.status, 200)
  assert.equal(response.body.total_volume, 249.95)
  assert.equal(response.body.total_payments, 5)
  assert.equal(response.body.payments_by_status.completed, 4)
  assert.equal(response.body.payments_by_status.failed, 1)
})

test("GET /api/payments/stats rejects non-admin callers", async () => {
  const app = buildApp()

  const response = await request(app)
    .get("/api/payments/stats")
    .set("Authorization", authHeader({ user_id: 11, role: "client" }))

  assert.equal(response.status, 403)
  assert.equal(response.body.message, "Access denied.")
})

test("DELETE /api/client/my-coach cancels active subscriptions", async () => {
  const app = buildApp()
  const transaction = createTransaction()
  const activeRelationship = {
    coach_user_id: 7,
    status: "active",
    end_date: null,
    async save() {
      return this
    },
  }

  ClientCoachRelationship.sequelize.transaction = async () => transaction
  ClientCoachRelationship.findOne = async () => activeRelationship
  Subscription.update = async () => [1]

  const response = await request(app)
    .delete("/api/client/my-coach")
    .set("Authorization", authHeader({ user_id: 11, role: "client" }))

  assert.equal(response.status, 204)
  assert.equal(activeRelationship.status, "inactive")
  assert.equal(transaction.state.commits, 1)
  assert.equal(transaction.state.rollbacks, 0)
})

test("DELETE /api/client/my-coach returns 404 when there is no active coach", async () => {
  const app = buildApp()
  const transaction = createTransaction()

  ClientCoachRelationship.sequelize.transaction = async () => transaction
  ClientCoachRelationship.findOne = async () => null

  const response = await request(app)
    .delete("/api/client/my-coach")
    .set("Authorization", authHeader({ user_id: 11, role: "client" }))

  assert.equal(response.status, 404)
  assert.match(response.body.error, /don't have an active coach/i)
  assert.equal(transaction.state.commits, 0)
  assert.equal(transaction.state.rollbacks, 1)
})