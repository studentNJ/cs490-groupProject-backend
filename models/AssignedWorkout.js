module.exports = (sequelize, DataTypes) => {
  const AssignedWorkout = sequelize.define(
    "AssignedWorkout",
    {
      assigned_workout_id: {
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
      workout_id: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      assigned_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("assigned", "completed", "skipped"),
        allowNull: false,
        defaultValue: "assigned",
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      coach_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "assigned_workout",
      timestamps: false,
    }
  );
  AssignedWorkout.associate = (models) => {
    AssignedWorkout.belongsTo(models.User, {
      as: "coach",
      foreignKey: "coach_user_id",
    });
    AssignedWorkout.belongsTo(models.User, {
      as: "client",
      foreignKey: "client_user_id",
    });
    AssignedWorkout.belongsTo(models.Workout, {
      foreignKey: "workout_id",
    });
  };
  return AssignedWorkout;
};
