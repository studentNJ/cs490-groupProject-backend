module.exports = (sequelize, DataTypes) => {
  const WorkoutLog = sequelize.define(
    "WorkoutLog",
    {
      workout_log_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      workout_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "workout_log",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  WorkoutLog.associate = (models) => {
    WorkoutLog.belongsTo(models.User, { foreignKey: "client_id" });
    WorkoutLog.belongsTo(models.Workout, { foreignKey: "workout_id" });
  };

  return WorkoutLog;
};
