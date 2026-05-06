module.exports = (sequelize, DataTypes) => {
  const SessionPackage = sequelize.define(
    "SessionPackage",
    {
      package_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      coach_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      session_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },
      discount_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: { min: 0, max: 100 },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "session_package",
      timestamps: false,
    }
  );

  SessionPackage.associate = (models) => {
    SessionPackage.belongsTo(models.User, {
      foreignKey: "coach_user_id",
      targetKey: "user_id",
      as: "coach",
    });
    SessionPackage.hasMany(models.SessionPurchase, {
      foreignKey: "package_id",
    });
  };

  return SessionPackage;
};
