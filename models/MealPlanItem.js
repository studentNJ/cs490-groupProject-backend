module.exports = (sequelize, DataTypes) => {
  const MealPlanItem = sequelize.define("MealPlanItem", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    meal_plan_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    meal_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    day_number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    meal_time: {
      type: DataTypes.ENUM("breakfast", "lunch", "dinner", "snack"),
      allowNull: false
    },

    servings: {
      type: DataTypes.FLOAT,
      defaultValue: 1
    }

  }, {
    tableName: "meal_plan_items",
    timestamps: false,
    underscored: true
  });

  MealPlanItem.associate = (models) => {
    MealPlanItem.belongsTo(models.MealPlan, {
      foreignKey: "meal_plan_id",
      as: "mealPlan"
    });

    MealPlanItem.belongsTo(models.Meal, {
      foreignKey: "meal_id",
      as: "meal"
    });
  };

  return MealPlanItem;
};