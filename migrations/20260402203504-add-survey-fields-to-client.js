"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Client", "goal", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Client", "type_workout", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Client", "diet_preference", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Client", "current_activity", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Client", "coach_help", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Client", "nutritionist_help", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Client", "workout_day", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("Client", "survey_completed", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("Client", "goal");
    await queryInterface.removeColumn("Client", "type_workout");
    await queryInterface.removeColumn("Client", "diet_preference");
    await queryInterface.removeColumn("Client", "current_activity");
    await queryInterface.removeColumn("Client", "coach_help");
    await queryInterface.removeColumn("Client", "nutritionist_help");
    await queryInterface.removeColumn("Client", "workout_day");
    await queryInterface.removeColumn("Client", "survey_completed");
  },
};
