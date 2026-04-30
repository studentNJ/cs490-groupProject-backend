const test = require("node:test")
const assert = require("node:assert/strict")
const { DataTypes } = require("sequelize")

const {
  sequelize,
  User,
  Client,
  Coach,
  CoachingPlan,
  Payment,
  Subscription,
} = require("../../models")

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

const setForeignKeyChecks = (enabled) =>
  sequelize.query(`SET FOREIGN_KEY_CHECKS = ${enabled ? 1 : 0}`)

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

  if (!tableNames.has("coach")) {
    await Coach.sync()
    tableNames.add("coach")
  }

  if (!tableNames.has("payment")) {
    await Payment.sync()
    tableNames.add("payment")
  }

  if (!tableNames.has("coaching_plan")) {
    await CoachingPlan.sync()
    tableNames.add("coaching_plan")
  }

  if (!tableNames.has("subscription")) {
    await Subscription.sync()
  }
})

test.beforeEach(async () => {
  await setForeignKeyChecks(false)
  await Subscription.destroy({ where: {} })
  await Payment.destroy({ where: {} })
  await Client.destroy({ where: {} })
  await Coach.destroy({ where: {} })
  await User.destroy({ where: {} })
  await setForeignKeyChecks(true)
})

test.after(async () => {
  await sequelize.close()
})

test("Payment and subscription records persist in the test database", async () => {
  const clientUser = await createUser({ role: "client" })
  const coachUser = await createUser({ role: "coach" })

  await Client.create({ user_id: clientUser.user_id })
  await Coach.create({ user_id: coachUser.user_id, price: 49.99 })

  const payment = await Payment.create({
    client_id: clientUser.user_id,
    coach_id: coachUser.user_id,
    transaction_id: `txn_${Date.now()}`,
    payment_method: "card",
    payment_amount: 49.99,
    payment_date: new Date(),
    payment_status: "completed",
    currency: "USD",
  })

  const subscription = await Subscription.create({
    client_id: clientUser.user_id,
    coach_id: coachUser.user_id,
    payment_id: payment.payment_id,
    start_date: "2026-04-22",
    end_date: "2026-05-22",
    status: "active",
  })

  const persistedPayment = await Payment.findByPk(payment.payment_id)
  const persistedSubscription = await Subscription.findByPk(
    subscription.subscription_id,
  )

  assert.equal(Number(persistedPayment.payment_amount), 49.99)
  assert.equal(persistedPayment.payment_status, "completed")
  assert.equal(persistedSubscription.status, "active")
  assert.equal(persistedSubscription.payment_id, payment.payment_id)
})

test("Subscription cancellation persists in the test database", async () => {
  const clientUser = await createUser({ role: "client" })
  const coachUser = await createUser({ role: "coach" })

  await Client.create({ user_id: clientUser.user_id })
  await Coach.create({ user_id: coachUser.user_id, price: 59.99 })

  const payment = await Payment.create({
    client_id: clientUser.user_id,
    coach_id: coachUser.user_id,
    transaction_id: `txn_${Date.now()}_cancel`,
    payment_method: "card",
    payment_amount: 59.99,
    payment_date: new Date(),
    payment_status: "completed",
    currency: "USD",
  })

  const subscription = await Subscription.create({
    client_id: clientUser.user_id,
    coach_id: coachUser.user_id,
    payment_id: payment.payment_id,
    start_date: "2026-04-22",
    end_date: "2026-05-22",
    status: "active",
  })

  await subscription.update({
    status: "cancelled",
    cancelled_at: new Date(),
  })

  const persistedSubscription = await Subscription.findByPk(
    subscription.subscription_id,
  )

  assert.equal(persistedSubscription.status, "cancelled")
  assert.ok(persistedSubscription.cancelled_at)
})