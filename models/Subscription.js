module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define(
    "Subscription",
    {
      subscription_id: {
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
        allowNull: false,
      },
      coaching_plan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      payment_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("active", "expired", "cancelled"),
        allowNull: false,
        defaultValue: "active",
      },
    },
    {
      tableName: "subscription",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Subscription.associate = (models) => {
    // For getMySubscription: User as "coach"
    if (models.User) {
      Subscription.belongsTo(models.User, {
        foreignKey: "client_id",
        targetKey: "user_id",
        as: "client",
      });
      Subscription.belongsTo(models.User, {
        foreignKey: "coach_id",
        targetKey: "user_id",
        as: "coach",
      });
    }

    // For getMySubscription: CoachingPlan as "coachingPlan"
    if (models.CoachingPlan) {
      Subscription.belongsTo(models.CoachingPlan, {
        foreignKey: "coaching_plan_id",
        as: "coachingPlan",
      });
    }

    if (models.Payment) {
      Subscription.belongsTo(models.Payment, {
        foreignKey: "payment_id",
      });
    }
  };

  return Subscription;
};
