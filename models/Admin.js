module.exports = (sequelize, DataTypes) => {
  // Admin model
  const Admin = sequelize.define(
    "Admin",
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,        
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "admin",
      underscored: true,
    }
  );

  // Associations
  Admin.associate = (models) => {
    // One to One Relationship
    Admin.belongsTo(models.User, { foreignKey: "user_id" });
    /*
    // things user creates
    User.hasMany(models.Workout, { foreignKey: "created_by_user_id" });
    User.hasMany(models.Meal, { foreignKey: "created_by_user_id" });
    User.hasMany(models.MealPlan, { foreignKey: "created_by_user_id" });
    User.hasMany(models.WorkoutPlan, { foreignKey: "created_by_user_id" });

    // messaging
    User.hasMany(models.Message, { as: "sentMessages", foreignKey: "from_id" });
    User.hasMany(models.Message, {
      as: "receivedMessages",
      foreignKey: "to_id",
    });
    */
  };

  const syncAdmin = Admin.sync().then(() => {
    console.log("Admin table synced");
  });


  return syncAdmin;
};