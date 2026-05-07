module.exports = (sequelize, DataTypes) => {
  const WorkoutLog = sequelize.define(
    "WorkoutLog",
    {
      workout_log_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
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
      },
    },
    {
      tableName: "workout_log",
      underscored: true,
      timestamps: true,
    }
  );

  WorkoutLog.associate = (models) => {
    WorkoutLog.belongsTo(models.Client, {
      foreignKey: "client_id",
      as: "client",
    });

    WorkoutLog.belongsTo(models.Workout, {
      foreignKey: "workout_id",
    });

    WorkoutLog.hasMany(models.StrengthLogDetail, {
      foreignKey: "workout_log_id",
      as: "strengthLogs",
    });

    WorkoutLog.hasMany(models.CardioLogDetail, {
      foreignKey: "workout_log_id",
      as: "cardioLogs",
    });
  };

  return WorkoutLog;
};
