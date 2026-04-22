"use strict"

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "google_id", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "google_id")
  },
}