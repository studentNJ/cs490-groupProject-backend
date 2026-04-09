module.exports = (sequelize, DataTypes) => {

    const Workout = sequelize.define(
        "Workout", 
        {
            workout_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            created_by_user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            description: {
                type: DataTypes.STRING(250),
                allowNull: true,
            },
            estimated_minutes: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            tableName: "workout",
            underscored: true,
            timestamps: false,
        }
    );

    //Associations
    Workout.associate = (models) => {
        Workout.belongsTo(models.User, { foreignKey: "created_by_user_id"});

        Workout.hasMany(models.workoutExercise, { foreignKey: "workout_id" });
    };
    
    return Workout;
};

