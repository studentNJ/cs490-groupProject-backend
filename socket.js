// socket.js
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

let io;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: FRONTEND_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("No token provided"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.user_id;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User ${socket.userId} connected (socket ${socket.id})`);
    socket.join(`user_${socket.userId}`);

    // Typing indicator events — pure relay, no DB
    socket.on("typing_start", ({ to_id }) => {
      io.to(`user_${to_id}`).emit("user_typing", {
        from_id: socket.userId,
        typing: true,
      });
    });

    socket.on("typing_stop", ({ to_id }) => {
      io.to(`user_${to_id}`).emit("user_typing", {
        from_id: socket.userId,
        typing: false,
      });
    });

    socket.on("disconnect", () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

module.exports = { initSocket, getIO };
