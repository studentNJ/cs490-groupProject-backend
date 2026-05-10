module.exports = (sequelize, DataTypes) => {
  const Nutritionist = sequelize.define(
    "Nutritionist",
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      price: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_approved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      description: {
        type: DataTypes.TEXT,
      }
    },
    {
      tableName: "nutritionist",
      underscored: true,
      timestamps: false,
    },
  )

  Nutritionist.associate = (models) => {
    // One to one
    Nutritionist.belongsTo(models.User, { foreignKey: "user_id" })
    /*
    // One to many
    Nutritionist.hasMany(models.ClientNutritionistRelationship, {
      foreignKey: "nutritionist_user_id",
    })
    Nutritionist.hasMany(models.NutritionistReview, {
      foreignKey: "nutritionist_user_id",
    })
    Nutritionist.hasMany(models.NutritionPlan, {
      foreignKey: "nutritionist_id",
    })
    Nutritionist.hasMany(models.Payment, { foreignKey: "nutritionist_id" })
    */
  }

  return Nutritionist
}
