module.exports = (sequelize, DataTypes) => {
  const Meal = sequelize.define("Meal", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    description: DataTypes.TEXT,

    calories_per_serving: {
      type: DataTypes.FLOAT,
      allowNull: false
    },

    protein: DataTypes.FLOAT,
    carbs: DataTypes.FLOAT,
    fat: DataTypes.FLOAT,
    fiber: { 
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    is_premade: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    created_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }

  }, {
    tableName: "meal",
    timestamps: true,
    underscored: true
  });

  Meal.associate = (models) => {
    Meal.belongsTo(models.User, {
      foreignKey: "created_by_user_id",
      as: "creator"
    });

    Meal.hasMany(models.MealPlanItem, {
      foreignKey: "meal_id"
    });

    Meal.hasMany(models.MealLog, {
      foreignKey: "meal_id"
    });
  };

  return Meal;
};