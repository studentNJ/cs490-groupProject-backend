module.exports = (sequelize, DataTypes) => {
  const MealLog = sequelize.define("MealLog", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    meal_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    servings: {
      type: DataTypes.FLOAT,
      allowNull: false
    },

    calories_consumed: {
      type: DataTypes.FLOAT,
      allowNull: false
    }

  }, {
    tableName: "meal_logs",
    timestamps: false,
    underscored: true
  });

  MealLog.associate = (models) => {
    MealLog.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user"
    });

    MealLog.belongsTo(models.Meal, {
      foreignKey: "meal_id",
      as: "meal"
    });
  };

  return MealLog;
};