"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adding the missing pieces to the existing table
    await queryInterface.addColumn("coach", "bio", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("coach", "experience_years", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });
    await queryInterface.addColumn("coach", "is_verified", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("coach", "bio");
    await queryInterface.removeColumn("coach", "experience_years");
    await queryInterface.removeColumn("coach", "is_verified");
  },
};
