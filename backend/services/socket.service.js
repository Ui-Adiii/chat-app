import { Server } from "socket.io";
import User from "../models/user.model.js";

// Maps
const onlineUsers = new Map();
const userHeartbeats = new Map();
const typingUsers = new Map();

let io = null; // 🔥 declare globally so all functions can use it

// -----------------------------------------------------
// 🔥 FIXED: broadcast function now works globally
// -----------------------------------------------------
const broadcastUserStatus = (userId, isOnline) => {
  if (!io) return; // safety check
  console.log(
    `Broadcasting status for user ${userId}: ${isOnline ? "online" : "offline"}`
  );

  io.emit("user_status", {
    userId,
    isOnline,
    lastSeen: isOnline ? null : new Date(),
  });
};

// -----------------------------------------------------
// Heartbeat checker
// -----------------------------------------------------
const checkHeartbeats = () => {
  const now = Date.now();
  userHeartbeats.forEach((last, userId) => {
    if (now - last > 90000) {
      console.log(`User ${userId} heartbeat timeout → offline`);
      userHeartbeats.delete(userId);
      onlineUsers.delete(userId);
      broadcastUserStatus(userId, false);
    }
  });
};
setInterval(checkHeartbeats, 30000);

// -----------------------------------------------------
// SOCKET INITIALIZATION
// -----------------------------------------------------
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL, "http://localhost:5173"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    let userId = null;

    // -------------------------------------------------
    // USER CONNECTED
    // -------------------------------------------------
    socket.on("user_connected", async (id) => {
      try {
        userId = id;
        onlineUsers.set(userId, socket.id);
        userHeartbeats.set(userId, Date.now());

        socket.join(userId);

        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        broadcastUserStatus(userId, true);
      } catch (err) {
        console.error("Error connecting user:", err);
      }
    });

    // -------------------------------------------------
    // HEARTBEAT
    // -------------------------------------------------
    socket.on("heartbeat", () => {
      if (userId) userHeartbeats.set(userId, Date.now());
    });

    // -------------------------------------------------
    // GET USER STATUS
    // -------------------------------------------------
    socket.on("get_user_status", (id, callback) => {
      const isOnline = onlineUsers.has(id);
      callback({
        userId: id,
        isOnline,
        lastSeen: isOnline ? new Date() : null,
      });
    });

    // -------------------------------------------------
    // TYPING START
    // -------------------------------------------------
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userId) return;

      io.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: true,
      });

      if (!typingUsers.has(userId)) typingUsers.set(userId, {});
      const u = typingUsers.get(userId);

      if (u[`${conversationId}_timeout`])
        clearTimeout(u[`${conversationId}_timeout`]);

      u[`${conversationId}_timeout`] = setTimeout(() => {
        io.to(receiverId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }, 3000);
    });

    // -------------------------------------------------
    // TYPING STOP
    // -------------------------------------------------
    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!userId) return;

      io.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    // -------------------------------------------------
    // USER DISCONNECT
    // -------------------------------------------------
    socket.on("disconnect", async () => {
      if (!userId) return;

      onlineUsers.delete(userId);
      userHeartbeats.delete(userId);

      // Clear typing timers
      if (typingUsers.has(userId)) {
        Object.values(typingUsers.get(userId))
          .filter((v) => typeof v === "number")
          .forEach(clearTimeout);
        typingUsers.delete(userId);
      }

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      broadcastUserStatus(userId, false);

      console.log(`User disconnected: ${userId}`);
    });
  });

  io.socketUserMap = onlineUsers;
  return io;
};

export default initializeSocket;
