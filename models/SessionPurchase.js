module.exports = (sequelize, DataTypes) => {
  const SessionPurchase = sequelize.define(
    "SessionPurchase",
    {
      purchase_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      client_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      coach_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      package_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      payment_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      total_sessions: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sessions_remaining: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      total_price_snapshot: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "exhausted", "refunded", "cancelled"),
        allowNull: false,
        defaultValue: "active",
      },
      purchased_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "session_purchase",
      timestamps: false,
    }
  );

  SessionPurchase.associate = (models) => {
    SessionPurchase.belongsTo(models.User, {
      foreignKey: "client_user_id",
      targetKey: "user_id",
      as: "client",
    });
    SessionPurchase.belongsTo(models.User, {
      foreignKey: "coach_user_id",
      targetKey: "user_id",
      as: "coach",
    });
    SessionPurchase.belongsTo(models.SessionPackage, {
      foreignKey: "package_id",
    });
    if (models.Payment) {
      SessionPurchase.belongsTo(models.Payment, {
        foreignKey: "payment_id",
      });
    }
    SessionPurchase.hasMany(models.SessionBooking, {
      foreignKey: "purchase_id",
    });
  };

  return SessionPurchase;
};
