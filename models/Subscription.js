module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define(
    "Subscription",
    {
      subscription_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      client_id: { type: DataTypes.INTEGER, allowNull: false },
      coach_id: { type: DataTypes.INTEGER, allowNull: false },
      coaching_plan_id: { type: DataTypes.INTEGER, allowNull: false },
      payment_id: { type: DataTypes.INTEGER, allowNull: false },
      start_date: { type: DataTypes.DATEONLY, allowNull: false },
      end_date: { type: DataTypes.DATEONLY, allowNull: false },
      cancelled_at: DataTypes.DATE,
      status: { type: DataTypes.STRING(20), allowNull: false }, // 'active' | 'expired' | 'cancelled'
    },
    {
      tableName: "subscription",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Subscription.associate = (models) => {
    Subscription.belongsTo(models.User, {
      foreignKey: "client_id",
      as: "client",
    });
    Subscription.belongsTo(models.User, {
      foreignKey: "coach_id",
      as: "coach",
    });
    Subscription.belongsTo(models.CoachingPlan, {
      foreignKey: "coaching_plan_id",
      as: "coachingPlan",
    });
    Subscription.belongsTo(models.Payment, {
      foreignKey: "payment_id",
      as: "payment",
    });
  };
  return Subscription;
};
