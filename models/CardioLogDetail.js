module.exports = (sequelize, DataTypes) => {
    const CardioLogDetail = sequelize.define(
        "CardioLogDetail",
        {
            cardio_log_id: {
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
            duration_minutes: {
                type: DataTypes.INTEGER,
                allowNull: null,
            },
            distance_km: {
                type: DataTypes.DECIMAL(6,2),
                allowNull: true,
            },
            avg_heart_rate: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            notes: {
                type: DataTypes.TEXT,
            },
        },
        {
            tableName: "cardio_log-detail",
            underscored: true,
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    CardioLogDetail.associate = (models) => {
        CardioLogDetail.belongsTo(models.WorkoutLog, { foreignKey: "workout_log_id", as: "workout", });

        CardioLogDetail.belongsTo(models.Exercise, { foreignKey: "exercise_id", as: "exercise", })
    };
    return CardioLogDetail;
};