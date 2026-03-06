const express = require("express");
const sequelize = require("./config/database");

const app = express();

sequelize.authenticate()
  .then(() => console.log("Database connected"))
  .catch(err => console.error("DB error:", err));

app.listen(4000, () => {
  console.log("Server running on port 4000");
});