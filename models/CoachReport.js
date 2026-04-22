module.exports = (sequelize, DataTypes) => {
  const CoachReport = sequelize.define(
    "CoachReport",
    {
      report_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      reporter_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      coach_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM(
          "unprofessional_behavior",
          "non_compliance",
          "communication_issues",
          "quality_of_service",
          "billing_dispute",
          "other",
        ),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      severity: {
        type: DataTypes.ENUM("low", "medium", "high", "critical"),
        allowNull: false,
        defaultValue: "medium",
      },
      status: {
        type: DataTypes.ENUM(
          "open",
          "under_review",
          "resolved",
          "dismissed",
          "escalated",
        ),
        allowNull: false,
        defaultValue: "open",
      },
      resolution_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      admin_reviewed_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      evidence_urls: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "coach_reports",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    },
  )

  CoachReport.associate = (models) => {
    CoachReport.belongsTo(models.User, {
      as: "reporter",
      foreignKey: "reporter_user_id",
    })
    CoachReport.belongsTo(models.User, {
      as: "coach",
      foreignKey: "coach_user_id",
    })
    CoachReport.belongsTo(models.User, {
      as: "reviewedBy",
      foreignKey: "admin_reviewed_by_user_id",
    })
  }

  return CoachReport
}