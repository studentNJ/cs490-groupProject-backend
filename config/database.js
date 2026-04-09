require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelizeConfig = {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
  logging: false,
};

if (process.env.DB_STORAGE) {
  sequelizeConfig.storage = process.env.DB_STORAGE;
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  sequelizeConfig
);
module.exports = sequelize;
