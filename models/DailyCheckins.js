module.exports = (sequelize, DataTypes) => {
  const DailyCheckin = sequelize.define(
    "DailyCheckin",
    {
      id: {
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

      mood_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 10 },
      },

      stress_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 10 },
      },

      motivation_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 10 },
      },

      energy_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 10 },
      },

      sleep_quality: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 10 },
      },

      body_quality: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      tableName: "daily_checkins",
      underscored: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        {
          unique: true,
          fields: ["user_id", "date"], // 🔥 required for upsert
        },
      ],
    }
  );

  DailyCheckin.associate = (models) => {
    DailyCheckin.belongsTo(models.User, {
      foreignKey: "user_id",
    });
  };

  return DailyCheckin;
};