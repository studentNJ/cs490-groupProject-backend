"use strict"

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("exercise", "is_active", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    })

    await queryInterface.addIndex("exercise", ["is_active"], {
      name: "idx_exercise_is_active",
    })
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("exercise", "idx_exercise_is_active")
    await queryInterface.removeColumn("exercise", "is_active")
  },
}