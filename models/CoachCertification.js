module.exports = (sequalize, DataTypes) => {
  //model for coach certifications
  const CoachCertification = sequalize.define(
    "CoachCertification",
    {
      certification_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      coach_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      document_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
      },
      admin_comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reviewed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "coach_certification",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  CoachCertification.associate = (models) => {
    CoachCertification.belongsTo(models.Coach, {
      foreignKey: "coach_id",
      targetKey: "user_id",
    });
  };

  return CoachCertification;
};
