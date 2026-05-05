"use strict"

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("coach_review", {
      review_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      coach_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "coach",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      client_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "client",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    })

    await queryInterface.addConstraint("coach_review", {
      fields: ["coach_user_id", "client_user_id"],
      type: "unique",
      name: "uq_cr_coach_client",
    })

    await queryInterface.addConstraint("coach_review", {
      fields: ["rating"],
      type: "check",
      where: {
        rating: {
          [Sequelize.Op.between]: [1, 5],
        },
      },
      name: "chk_cr_rating",
    })
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint("coach_review", "chk_cr_rating")
    await queryInterface.removeConstraint("coach_review", "uq_cr_coach_client")
    await queryInterface.dropTable("coach_review")
  },
}
