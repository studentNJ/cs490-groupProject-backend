module.exports = (sequelize, DataTypes) => {
  // Coach Model
  // Coach model
  const Coach = sequelize.define(
    "Coach",
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      specialization: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      // Add these to match your new migration
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      experience_years: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "coach",
      underscored: true,
      timestamps: false, // coach table only have updated_at not craeted_at
    }
  );
  // Associations
  Coach.associate = (models) => {
    Coach.belongsTo(models.User, { foreignKey: "user_id" }); // coach IS a user

    Coach.hasMany(models.ClientCoachRelationship, {
      foreignKey: "coach_user_id",
    });

    Coach.hasMany(models.CoachQualification,{
      foreignKey: "coach_user_id",
    });

    Coach.hasMany(models.CoachCertification, {
      foreignKey: "coach_user_id",
    });
    /*
    Coach.hasMany(models.ClientCoachRelationship, {
      foreignKey: "coach_user_id",
    }); // coach has many clients
    Coach.hasMany(models.CoachReview, { foreignKey: "coach_user_id" }); // coach has many reviews
    Coach.hasMany(models.SessionPackage, { foreignKey: "coach_id" }); // coach has many packages
    Coach.hasMany(models.CoachingPlan, { foreignKey: "coach_id" }); // coach has many plans
    Coach.hasMany(models.Session, { foreignKey: "coach_id" }); // coach has many sessions
    Coach.hasMany(models.Subscription, { foreignKey: "coach_id" }); // coach has many subscriptions
    Coach.hasMany(models.Payment, { foreignKey: "coach_id" });
    */
  };

  return Coach;
};
