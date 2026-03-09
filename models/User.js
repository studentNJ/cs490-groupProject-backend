module.exports = (sequelize, DataTypes) => {
  // User model
  const User = sequelize.define(
    "User",
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          isAlpha: true,
        },
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          isAlpha: true,
        },
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          isEmail: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      profile_pic: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM("client", "coach", "nutritionist", "admin"),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "users",
      underscored: true,
    }
  );

  // Associations
  User.associate = (models) => {
    // One to One Relationship
    User.hasOne(models.Client, { foreignKey: "user_id" });
    User.hasOne(models.Coach, { foreignKey: "user_id" });
    User.hasOne(models.Nutritionist, { foreignKey: "user_id" });
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
  return User;
};
