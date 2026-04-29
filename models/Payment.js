module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    "Payment",
    {
      payment_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      coach_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      transaction_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      payment_method: {
        type: DataTypes.ENUM("card", "cash", "bank_transfer"),
        allowNull: false,
      },
      payment_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      payment_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      payment_status: {
        type: DataTypes.ENUM("pending", "completed", "failed", "refunded"),
        allowNull: false,
        defaultValue: "pending",
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "USD",
      },
    },
    {
      tableName: "payment",
      underscored: true,
      createdAt: "created_at",
      updatedAt: false,
    },
  )

  Payment.associate = (models) => {
    if (models.Client) {
      Payment.belongsTo(models.Client, {
        foreignKey: "client_id",
        targetKey: "user_id",
      })
    }

    if (models.Coach) {
      Payment.belongsTo(models.Coach, {
        foreignKey: "coach_id",
        targetKey: "user_id",
      })
    }

    if (models.Subscription) {
      Payment.hasMany(models.Subscription, {
        foreignKey: "payment_id",
      })
    }
  }

  return Payment;
}
