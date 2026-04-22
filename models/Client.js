const { underscoredIf } = require("sequelize/lib/utils")

module.exports = (sequalize, DataTypes) => {
  const Client = sequalize.define(
    "Client",
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      height: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      weight: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      goal_weight: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      // Survey Fields
      // New survey fields
      goal: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type_workout: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      diet_preference: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      current_activity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      coach_help: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nutritionist_help: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      workout_day: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      survey_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "client",
      underscored: true,
      timestamps: false,
    },
  )
  Client.associate = (models) => {
    // One to one
    Client.belongsTo(models.User, { foreignKey: "user_id" })

    // One to many
    Client.hasMany(models.ClientCoachRelationship, {
      foreignKey: "client_user_id",
    });
    /*
    Client.hasMany(models.ClientCoachRelationship, {
      foreignKey: "client_user_id",
    })
    Client.hasMany(models.ClientNutritionistRelationship, {
      foreignKey: "client_user_id",
    })
    Client.hasMany(models.CoachReview, { foreignKey: "client_user_id" })
    Client.hasMany(models.NutritionistReview, { foreignKey: "client_user_id" })
    Client.hasMany(models.MealPlan, { foreignKey: "client_id" })
    Client.hasMany(models.WorkoutPlan, { foreignKey: "client_id" })
    Client.hasMany(models.WorkoutLog, { foreignKey: "client_id" })
    Client.hasMany(models.Payment, { foreignKey: "client_id" })
    Client.hasMany(models.Subscription, { foreignKey: "client_id" })
    Client.hasMany(models.Session, { foreignKey: "client_id" })
    */
  }

  return Client
}
