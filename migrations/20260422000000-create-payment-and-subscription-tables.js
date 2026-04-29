"use strict"

const tableExists = async (queryInterface, tableName) => {
  try {
    await queryInterface.describeTable(tableName)
    return true
  } catch (_error) {
    return false
  }
}

const addIndexIfMissing = async (queryInterface, tableName, fields, name) => {
  const indexes = await queryInterface.showIndex(tableName)
  if (!indexes.some((index) => index.name === name)) {
    await queryInterface.addIndex(tableName, fields, { name })
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await tableExists(queryInterface, "payment"))) {
      await queryInterface.createTable("payment", {
        payment_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        client_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "users",
            key: "user_id",
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        coach_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "users",
            key: "user_id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        transaction_id: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
        },
        payment_method: {
          type: Sequelize.ENUM("card", "cash", "bank_transfer"),
          allowNull: false,
        },
        payment_amount: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
        },
        payment_date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn("NOW"),
        },
        payment_status: {
          type: Sequelize.ENUM("pending", "completed", "failed", "refunded"),
          allowNull: false,
          defaultValue: "pending",
        },
        currency: {
          type: Sequelize.STRING(10),
          allowNull: false,
          defaultValue: "USD",
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn("NOW"),
        },
      })
    }

    await addIndexIfMissing(queryInterface, "payment", ["client_id"], "idx_payment_client_id")
    await addIndexIfMissing(queryInterface, "payment", ["coach_id"], "idx_payment_coach_id")
    await addIndexIfMissing(queryInterface, "payment", ["payment_status"], "idx_payment_status")
    await addIndexIfMissing(queryInterface, "payment", ["payment_date"], "idx_payment_date")

    if (!(await tableExists(queryInterface, "subscription"))) {
      await queryInterface.createTable("subscription", {
        subscription_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        client_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "users",
            key: "user_id",
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        coach_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "users",
            key: "user_id",
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        payment_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "payment",
            key: "payment_id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        start_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        end_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        cancelled_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM("active", "expired", "cancelled"),
          allowNull: false,
          defaultValue: "active",
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn("NOW"),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn("NOW"),
        },
      })
    } else {
      const subscriptionTable = await queryInterface.describeTable("subscription")

      if (subscriptionTable.coaching_plan_id) {
        await queryInterface.sequelize.query(
          "ALTER TABLE subscription MODIFY coaching_plan_id INT NULL",
        )
      }

      if (!subscriptionTable.end_date) {
        await queryInterface.addColumn("subscription", "end_date", {
          type: Sequelize.DATEONLY,
          allowNull: true,
        })
      }
    }

    await addIndexIfMissing(
      queryInterface,
      "subscription",
      ["client_id", "coach_id"],
      "idx_subscription_client_coach",
    )
    await addIndexIfMissing(queryInterface, "subscription", ["status"], "idx_subscription_status")
    await addIndexIfMissing(queryInterface, "subscription", ["end_date"], "idx_subscription_end_date")
  },

  async down(queryInterface) {
    const paymentExists = await tableExists(queryInterface, "payment")
    const subscriptionExists = await tableExists(queryInterface, "subscription")

    if (subscriptionExists) {
      const subscriptionIndexes = await queryInterface.showIndex("subscription")
      if (subscriptionIndexes.some((index) => index.name === "idx_subscription_end_date")) {
        await queryInterface.removeIndex("subscription", "idx_subscription_end_date")
      }
      if (subscriptionIndexes.some((index) => index.name === "idx_subscription_status")) {
        await queryInterface.removeIndex("subscription", "idx_subscription_status")
      }
      if (
        subscriptionIndexes.some(
          (index) => index.name === "idx_subscription_client_coach",
        )
      ) {
        await queryInterface.removeIndex("subscription", "idx_subscription_client_coach")
      }
    }

    if (paymentExists) {
      const paymentIndexes = await queryInterface.showIndex("payment")
      if (paymentIndexes.some((index) => index.name === "idx_payment_date")) {
        await queryInterface.removeIndex("payment", "idx_payment_date")
      }
      if (paymentIndexes.some((index) => index.name === "idx_payment_status")) {
        await queryInterface.removeIndex("payment", "idx_payment_status")
      }
      if (paymentIndexes.some((index) => index.name === "idx_payment_coach_id")) {
        await queryInterface.removeIndex("payment", "idx_payment_coach_id")
      }
      if (paymentIndexes.some((index) => index.name === "idx_payment_client_id")) {
        await queryInterface.removeIndex("payment", "idx_payment_client_id")
      }
    }
  },
}