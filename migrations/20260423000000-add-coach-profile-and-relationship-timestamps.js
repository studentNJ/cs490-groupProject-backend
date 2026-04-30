"use strict"

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("coach", "bio", {
      type: Sequelize.TEXT,
      allowNull: true,
    })

    await queryInterface.addColumn("coach", "experience_years", {
      type: Sequelize.INTEGER,
      allowNull: true,
    })

    await queryInterface.addColumn("coach", "is_verified", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    })

    await queryInterface.addColumn("client_coach_relationship", "requested_at", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    })

    await queryInterface.addColumn("client_coach_relationship", "responded_at", {
      type: Sequelize.DATE,
      allowNull: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("client_coach_relationship", "responded_at")
    await queryInterface.removeColumn("client_coach_relationship", "requested_at")
    await queryInterface.removeColumn("coach", "is_verified")
    await queryInterface.removeColumn("coach", "experience_years")
    await queryInterface.removeColumn("coach", "bio")
  },
}