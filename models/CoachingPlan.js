module.exports = (sequelize, DataTypes) => {
  const CoachingPlan = sequelize.define(
    "CoachingPlan",
    {
      plan_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      coach_id: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING(100), allowNull: false },
      plan_duration: { type: DataTypes.INTEGER, allowNull: false }, // days
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      currency: { type: DataTypes.STRING(10), defaultValue: "USD" },
      description: { type: DataTypes.TEXT },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "coaching_plan",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  CoachingPlan.associate = (models) => {
    CoachingPlan.belongsTo(models.User, {
      foreignKey: "coach_id",
      as: "coach",
    });
    CoachingPlan.hasMany(models.Subscription, {
      foreignKey: "coaching_plan_id",
      as: "subscriptions",
    });
  };

  return CoachingPlan;
};
