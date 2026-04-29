const { Op } = require("sequelize")
const {
  Payment,
  Subscription,
  Client,
  Coach,
  User,
  ClientCoachRelationship,
} = require("../models")

const getActiveRole = (req) => req.headers["x-active-role"] || req.user.role

const generateTransactionId = (prefix = "txn") => {
  const randomPart = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${Date.now()}_${randomPart}`
}

const addOneMonth = (dateString) => {
  const nextDate = new Date(dateString)
  nextDate.setMonth(nextDate.getMonth() + 1)
  return nextDate.toISOString().split("T")[0]
}

module.exports.process_payment = async (req, res) => {
  const transaction = await Payment.sequelize.transaction()

  try {
    if (getActiveRole(req) !== "client") {
      await transaction.rollback()
      return res.status(403).json({ error: "Clients only" })
    }

    const clientId = req.user.user_id
    const coachId = parseInt(req.body.coach_id, 10)
    const paymentMethod = req.body.payment_method || "card"
    const currency = req.body.currency || "USD"

    if (isNaN(coachId)) {
      await transaction.rollback()
      return res.status(400).json({ error: "Valid coach_id is required" })
    }

    const activeRelationship = await ClientCoachRelationship.findOne({
      where: {
        client_user_id: clientId,
        coach_user_id: coachId,
        status: "active",
      },
      transaction,
    })

    if (!activeRelationship) {
      await transaction.rollback()
      return res.status(400).json({
        error: "An active client-coach relationship is required before payment.",
      })
    }

    const coach = await Coach.findByPk(coachId, { transaction })
    if (!coach) {
      await transaction.rollback()
      return res.status(404).json({ error: "Coach not found" })
    }

    if (coach.price === null || coach.price === undefined) {
      await transaction.rollback()
      return res.status(400).json({ error: "Coach price is not set" })
    }

    const today = new Date().toISOString().split("T")[0]
    const transactionId = generateTransactionId()

    const payment = await Payment.create(
      {
        client_id: clientId,
        coach_id: coachId,
        transaction_id: transactionId,
        payment_method: paymentMethod,
        payment_amount: coach.price,
        payment_date: new Date(),
        payment_status: "completed",
        currency,
      },
      { transaction },
    )

    const existingSubscription = await Subscription.findOne({
      where: {
        client_id: clientId,
        coach_id: coachId,
        status: {
          [Op.in]: ["active", "expired"],
        },
      },
      order: [["subscription_id", "DESC"]],
      transaction,
    })

    let subscription
    if (existingSubscription) {
      subscription = await existingSubscription.update(
        {
          payment_id: payment.payment_id,
          status: "active",
          cancelled_at: null,
          end_date: addOneMonth(today),
        },
        { transaction },
      )
    } else {
      subscription = await Subscription.create(
        {
          client_id: clientId,
          coach_id: coachId,
          payment_id: payment.payment_id,
          start_date: today,
          end_date: addOneMonth(today),
          status: "active",
        },
        { transaction },
      )
    }

    await transaction.commit()

    return res.status(201).json({
      message: "Payment recorded successfully.",
      payment,
      subscription,
    })
  } catch (error) {
    await transaction.rollback()
    return res.status(500).json({ error: error.message })
  }
}

module.exports.get_payment_history = async (req, res) => {
  try {
    if (getActiveRole(req) !== "client") {
      return res.status(403).json({ error: "Clients only" })
    }

    const payments = await Payment.findAll({
      where: { client_id: req.user.user_id },
      include: [
        {
          model: Coach,
          attributes: ["user_id", "specialization", "price"],
          include: [
            {
              model: User,
              attributes: ["user_id", "first_name", "last_name", "profile_pic"],
            },
          ],
        },
      ],
      order: [["payment_date", "DESC"]],
    })

    return res.status(200).json({ payments })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports.get_coach_earnings = async (req, res) => {
  try {
    if (getActiveRole(req) !== "coach") {
      return res.status(403).json({ error: "Coaches only" })
    }

    const coachId = req.user.user_id
    const completedWhere = {
      coach_id: coachId,
      payment_status: "completed",
    }

    const [totalEarnings, totalPayments, recentPayments] = await Promise.all([
      Payment.sum("payment_amount", { where: completedWhere }),
      Payment.count({ where: completedWhere }),
      Payment.findAll({
        where: completedWhere,
        include: [
          {
            model: Client,
            attributes: ["user_id"],
            include: [
              {
                model: User,
                attributes: ["user_id", "first_name", "last_name", "profile_pic"],
              },
            ],
          },
        ],
        order: [["payment_date", "DESC"]],
        limit: 10,
      }),
    ])

    return res.status(200).json({
      total_earnings: Number(totalEarnings || 0),
      total_payments: totalPayments,
      recent_payments: recentPayments,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports.get_payment_stats = async (_req, res) => {
  try {
    const [totalVolume, totalPayments, statusRows] = await Promise.all([
      Payment.sum("payment_amount", {
        where: { payment_status: "completed" },
      }),
      Payment.count(),
      Payment.findAll({
        attributes: [
          "payment_status",
          [Payment.sequelize.fn("COUNT", Payment.sequelize.col("payment_id")), "count"],
        ],
        group: ["payment_status"],
        raw: true,
      }),
    ])

    const paymentsByStatus = statusRows.reduce((accumulator, row) => {
      accumulator[row.payment_status] = Number(row.count)
      return accumulator
    }, {})

    return res.status(200).json({
      total_volume: Number(totalVolume || 0),
      total_payments: totalPayments,
      payments_by_status: paymentsByStatus,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
