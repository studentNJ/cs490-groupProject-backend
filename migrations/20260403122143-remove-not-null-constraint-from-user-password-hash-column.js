"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Make password_hash nullable
    await queryInterface.changeColumn("Users", "password_hash", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // 2. Add the google_id column
    await queryInterface.addColumn("Users", "google_id", {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Remove the google_id column first
    await queryInterface.removeColumn("Users", "google_id");

    // 2. Clean up NULL passwords before re-applying NOT NULL
    // This prevents the migration from failing if Google users exist
    await queryInterface.bulkUpdate(
      "Users",
      { password_hash: "MANUAL_RESET_REQUIRED" },
      { password_hash: null }
    );

    // 3. Re-apply the NOT NULL constraint to password_hash
    await queryInterface.changeColumn("Users", "password_hash", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
