module.exports = (sequelize, DataTypes) => {
  const CoachAvailabilityRule = sequelize.define(
    "CoachAvailabilityRule",
    {
      rule_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      coach_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      day_of_week: {
        type: DataTypes.TINYINT,
        allowNull: false,
        validate: { min: 0, max: 6 },
      },
      start_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      end_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 60,
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
      tableName: "coach_availability_rule",
      timestamps: false,
    }
  );

  CoachAvailabilityRule.associate = (models) => {
    CoachAvailabilityRule.belongsTo(models.User, {
      foreignKey: "coach_user_id",
      targetKey: "user_id",
      as: "coach",
    });
    CoachAvailabilityRule.hasMany(models.SessionBooking, {
      foreignKey: "rule_id",
    });
  };

  return CoachAvailabilityRule;
};
