"use strict"

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("coach_reports", {
      report_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      reporter_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      coach_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      category: {
        type: Sequelize.ENUM(
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
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      severity: {
        type: Sequelize.ENUM("low", "medium", "high", "critical"),
        allowNull: false,
        defaultValue: "medium",
      },
      status: {
        type: Sequelize.ENUM(
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
        type: Sequelize.TEXT,
        allowNull: true,
      },
      admin_reviewed_by_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      evidence_urls: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    })

    await queryInterface.addIndex("coach_reports", ["coach_user_id", "status"], {
      name: "idx_coach_reports_coach_status",
    })
    await queryInterface.addIndex("coach_reports", ["reporter_user_id"], {
      name: "idx_coach_reports_reporter",
    })
    await queryInterface.addIndex("coach_reports", ["created_at"], {
      name: "idx_coach_reports_created_at",
    })
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("coach_reports", "idx_coach_reports_created_at")
    await queryInterface.removeIndex("coach_reports", "idx_coach_reports_reporter")
    await queryInterface.removeIndex("coach_reports", "idx_coach_reports_coach_status")
    await queryInterface.dropTable("coach_reports")
  },
}