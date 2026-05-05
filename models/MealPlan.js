module.exports = (sequelize, DataTypes) => {
  const MealPlan = sequelize.define("MealPlan", {
    meal_plan_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    created_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    end_date: DataTypes.DATEONLY,

    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1
    }

  }, {
    tableName: "meal_plan",
    timestamps: false,
    underscored: true
  });

  MealPlan.associate = (models) => {
    MealPlan.belongsTo(models.User, {
      foreignKey: "created_by_user_id",
      as: "creator"
    });

    MealPlan.belongsTo(models.User, {
      foreignKey: "client_id",
      as: "client"
    });

    MealPlan.hasMany(models.MealPlanItem, {
      foreignKey: "meal_plan_id",
      as: "items"
    });
  };

  return MealPlan;
};