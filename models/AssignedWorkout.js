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
        type: DataTypes.INTEGER,
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
<<<<<<< HEAD
        type: DataTypes.ENUM(
          "assigned",
          "accepted",
          "declined",
          "completed",
          "skipped"
        ),
=======
        type: DataTypes.ENUM("assigned", "completed", "skipped", "accepted", "declined"),
>>>>>>> beb6e72c04e3ca0968709e8827df33fc9688aad7
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
