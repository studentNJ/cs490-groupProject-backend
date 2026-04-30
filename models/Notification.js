module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      notification_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      recipient_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      actor_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      for_role: {
        type: DataTypes.ENUM("client", "coach", "nutritionist"),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(
          "coach_request_received",
          "coach_request_approved",
          "coach_request_rejected",
          "workout_assigned",
          "workout_completed",
          "client_unhired",
          "coach_dropped_client"
        ),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      body: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      link: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      related_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      related_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "notification",
      timestamps: false, // we manage created_at manually, no updated_at needed
    }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      as: "recipient",
      foreignKey: "recipient_user_id",
    });
    Notification.belongsTo(models.User, {
      as: "actor",
      foreignKey: "actor_user_id",
    });
  };

  return Notification;
};
