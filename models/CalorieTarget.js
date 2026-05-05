module.exports = (sequelize, DataTypes) => {
  const CalorieTarget = sequelize.define(
    "CalorieTarget",
    {
      target_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      weekly_target: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
    },
    {
      tableName: "calorie_targets",
      underscored: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  CalorieTarget.associate = (models) => {
    CalorieTarget.belongsTo(models.User, {
      foreignKey: "user_id",
    });
  };

  return CalorieTarget;
};