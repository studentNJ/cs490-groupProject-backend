module.exports = (sequelize, DataTypes) => {

    const StrengthLogDetail = sequelize.define(
        "StrengthLogDetail",
        {
            strength_log_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            workout_log_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: null,
            },
            exercise_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            sets: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            reps: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            weight_lbs: {
                type: DataTypes.DECIMAL(6, 2),
                allowNull: true,
                defaultValue: true,
            },
            notes: {
                type: DataTypes.TEXT,
            },
        },
        {
            tableName:"strength_log_detail",
            underscored: true,
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    StrengthLogDetail.associate = (models) => {
        
        StrengthLogDetail.belongsTo(models.WorkoutLog, { foreignKey: "workout_log_id", as: "workout" });

        StrengthLogDetail.belongsTo(models.Exercise, { foreignKey: "exercise_id", as: "exercise", });

    };

    return StrengthLogDetail;
};