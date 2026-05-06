module.exports = (sequelize, DataTypes) => {
  const SessionBooking = sequelize.define(
    "SessionBooking",
    {
      booking_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      purchase_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rule_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      coach_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      client_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("confirmed", "completed", "cancelled", "no_show"),
        allowNull: false,
        defaultValue: "confirmed",
      },
      client_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      coach_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cancelled_by: {
        type: DataTypes.ENUM("client", "coach"),
        allowNull: true,
      },
      cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      cancellation_reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      booked_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "session_booking",
      timestamps: false,
    }
  );

  SessionBooking.associate = (models) => {
    SessionBooking.belongsTo(models.SessionPurchase, {
      foreignKey: "purchase_id",
    });
    SessionBooking.belongsTo(models.CoachAvailabilityRule, {
      foreignKey: "rule_id",
    });
    SessionBooking.belongsTo(models.User, {
      foreignKey: "client_user_id",
      targetKey: "user_id",
      as: "client",
    });
    SessionBooking.belongsTo(models.User, {
      foreignKey: "coach_user_id",
      targetKey: "user_id",
      as: "coach",
    });
  };

  return SessionBooking;
};
