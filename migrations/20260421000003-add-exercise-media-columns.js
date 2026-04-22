"use strict"

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("exercise", "video_url", {
      type: Sequelize.STRING,
      allowNull: true,
    })

    await queryInterface.addColumn("exercise", "image_url", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "",
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("exercise", "image_url")
    await queryInterface.removeColumn("exercise", "video_url")
  },
}