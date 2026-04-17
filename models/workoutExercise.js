const { DataTypes } = require("sequelize");
const workout = require("./workout");

module.exports = (sequelize, DataTypes) => {
    const workoutExercise = sequelize.define(
        "workoutExercise",
        {
            workout_exercise_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            workout_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: null,
            },
            exercise_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: null,
            },
            sets: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            reps: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            rest_seconds: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: null,
            },
            order_index: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            notes: {
                type: DataTypes.STRING(250),
            },
        },
        {
            tableName:"workout_exercise",
            underscored:true,
            timestamps: false,
        }
    );

    //Associations
    workoutExercise.associate = (models) => {
       
        workoutExercise.belongsTo(models.Workout, { foreignKey: "workout_id" });
        workoutExercise.belongsTo(models.Exercise, { foreignKey: "exercise_id" });
    };

    return workoutExercise;
};
