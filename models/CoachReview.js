module.exports = (sequelize, DataTypes) => {
  const CoachReview = sequelize.define(
    "CoachReview",
    {
      review_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      coach_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      client_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "coach_review",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  )

  CoachReview.associate = (models) => {
    CoachReview.belongsTo(models.User, {
      as: "coachUser",
      foreignKey: "coach_user_id",
    })
    CoachReview.belongsTo(models.User, {
      as: "clientUser",
      foreignKey: "client_user_id",
    })
    CoachReview.belongsTo(models.Coach, {
      as: "coach",
      foreignKey: "coach_user_id",
      targetKey: "user_id",
    })
    CoachReview.belongsTo(models.Client, {
      as: "client",
      foreignKey: "client_user_id",
      targetKey: "user_id",
    })
  }

  return CoachReview
}
