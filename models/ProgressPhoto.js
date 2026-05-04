module.exports = (sequelize, DataTypes) => {
  const ProgressPhoto = sequelize.define(
    "ProgressPhoto",
    {
      photo_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      image_data: {
        type: DataTypes.TEXT("medium"),
        allowNull: false,
      },
      caption: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      taken_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "progress_photo",
      timestamps: false,
    }
  );

  ProgressPhoto.associate = (models) => {
    ProgressPhoto.belongsTo(models.User, {
      foreignKey: "user_id",
    });
  };

  return ProgressPhoto;
};
