module.exports = (sequelize, DataTypes) => {
  const ClientNutritionistRelationship = sequelize.define(
    "ClientNutritionistRelationship",
    {
      client_user_id: { type: DataTypes.INTEGER, primaryKey: true },
      nutritionist_user_id: { type: DataTypes.INTEGER, primaryKey: true },
      status: {
        type: DataTypes.ENUM("active", "inactive", "pending"),
        allowNull: false,
        defaultValue: "active",
      },
      start_date: DataTypes.DATEONLY,
      end_date: DataTypes.DATEONLY,
    },
    {
      tableName: "client_nutritionist_relationship",
      timestamps: false,
    }
  );

  ClientNutritionistRelationship.associate = (models) => {
    ClientNutritionistRelationship.belongsTo(models.User, {
      as: "client",
      foreignKey: "client_user_id",
    });
    ClientNutritionistRelationship.belongsTo(models.User, {
      as: "nutritionist",
      foreignKey: "nutritionist_user_id",
    });
  };

  return ClientNutritionistRelationship;
};
