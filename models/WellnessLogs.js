module.exports = (sequelize, DataTypes) => {
    const WellnessLogs = sequelize.define(
        "WellnessLogs",
        {
            wl_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },

            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },

            water_intake_oz: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },

            sleep_hours: {
                type: DataTypes.DECIMAL(4, 2),
            },

            notes: {
                type: DataTypes.TEXT,
            },

            steps: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
        },
        {
            tableName: "wellness_logs",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            indexes: [
                {
                    unique: true,
                    fields: ["user_id", "date"],
                },
            ],
        }
    );

    WellnessLogs.associate = (models) => {
        WellnessLogs.belongsTo(models.Client, { foreignKey: "user_id", targetKey: "user_id", });
    } 

    return WellnessLogs;    
};