module.exports = (sequelize, DataTypes) => {
    const Exercise = sequelize.define(
        "Exercise",
        {
            exercise_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },

            category: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },

            equipment: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },

            pirmary_muscles: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },

            instructions: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },

            video_url: {
                type: DataTypes.STRING,
                allowNull: true,
            },

            image_url: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            tableName: "exercise",
            underscored: true,
            timestamps: false,
        }
    );

    Exercise.associate = (models) => {
        
        Exercise.hasMany(models.workoutExercise, { foreignKey: "exercise_id" });

        Exercise.belongsToMany(models.Workout, {through: "workout_exercise", foreignKey: "exercise_id" });
    };

    return Exercise;
};