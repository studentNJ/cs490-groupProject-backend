const app = require("./app");
const { initSocket } = require("./socket");

const server = app.listen(4000, () => {
  console.log("Server running on port 4000");
});

initSocket(server);
