"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // In Migration:
    await queryInterface.addColumn("Users", "profile_pic", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the profile_pic column first
    await queryInterface.removeColumn("Users", "profile_pic");
  },
};
