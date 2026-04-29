module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    "Payment",
    {
      payment_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      client_id: { type: DataTypes.INTEGER, allowNull: false },
      coach_id: DataTypes.INTEGER,
      nutritionist_id: DataTypes.INTEGER,
      package_id: DataTypes.INTEGER,
      coaching_plan_id: DataTypes.INTEGER,
      nutrition_plan_id: DataTypes.INTEGER,
      transaction_id: { type: DataTypes.STRING(100), unique: true },
      payment_method: { type: DataTypes.STRING(20), allowNull: false }, // 'card' | 'cash' | 'bank_transfer'
      payment_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      payment_date: { type: DataTypes.DATE, allowNull: false },
      payment_status: { type: DataTypes.STRING(20), allowNull: false }, // 'pending' | 'completed' | 'failed' | 'refunded'
      currency: { type: DataTypes.STRING(10), defaultValue: "USD" },
    },
    {
      tableName: "payment",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false, // payment table only has created_at
    }
  );

  Payment.associate = (models) => {
    Payment.belongsTo(models.User, { foreignKey: "client_id", as: "client" });
    Payment.belongsTo(models.User, { foreignKey: "coach_id", as: "coach" });
    Payment.belongsTo(models.CoachingPlan, {
      foreignKey: "coaching_plan_id",
      as: "coachingPlan",
    });
    Payment.hasOne(models.Subscription, {
      foreignKey: "payment_id",
      as: "subscription",
    });
  };
  return Payment;
};
