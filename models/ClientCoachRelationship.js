module.exports = (sequelize, DataTypes) => {
  const ClientCoachRelationship = sequelize.define(
    "ClientCoachRelationship",
    {
      client_coach_relationship_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      client_user_id: { type: DataTypes.INTEGER, allowNull: false },
      coach_user_id: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.ENUM("active", "inactive", "pending"),
        allowNull: false,
        defaultValue: "pending",
      },
      start_date: DataTypes.DATEONLY,
      end_date: DataTypes.DATEONLY,
      requested_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      responded_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "client_coach_relationship",
      timestamps: false,
    }
  );

  ClientCoachRelationship.associate = (models) => {
    ClientCoachRelationship.belongsTo(models.User, {
      as: "client",
      foreignKey: "client_user_id",
    });
    ClientCoachRelationship.belongsTo(models.User, {
      as: "coach",
      foreignKey: "coach_user_id",
    });
  };

  return ClientCoachRelationship;
};
