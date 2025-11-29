import { Server } from "socket.io";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

//map for online users => (userId ,SocketId)
const onlineUsers = new Map();

// Map to track user heartbeats
const userHeartbeats = new Map();

//map to track typing status -> userId -> [conversation]:boolean
const typingUsers = new Map();

// Function to broadcast user status to all connected users
const broadcastUserStatus = (userId, isOnline) => {
  console.log(`Broadcasting status for user ${userId}: ${isOnline ? 'online' : 'offline'}`);
  io.emit("user_status", { 
    userId, 
    isOnline,
    lastSeen: isOnline ? null : new Date()
  });
};

// Function to check user heartbeats and mark users as offline if they haven't responded
const checkHeartbeats = () => {
  const now = Date.now();
  userHeartbeats.forEach((lastHeartbeat, userId) => {
    // If user hasn't sent heartbeat in over 90 seconds, mark as offline
    if (now - lastHeartbeat > 90000) {
      console.log(`User ${userId} heartbeat timeout, marking as offline`);
      userHeartbeats.delete(userId);
      onlineUsers.delete(userId);
      broadcastUserStatus(userId, false);
    }
  });
};

// Start heartbeat checker
setInterval(checkHeartbeats, 30000); // Check every 30 seconds

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // List of allowed origins
        const allowedOrigins = [
          process.env.FRONTEND_URL,
          "http://localhost:5173",
        ];

        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    },
    pingTimeout: 60 * 1000, //disconnect inactive users or sockets after 1 mint
    pingInterval: 25000, // Ping every 25 seconds
  });

  //when a new socket connection established
  io.on("connection", (socket) => {
    console.log(`user connected: ${socket.id}`);
    let userId = null;

    socket.on("user_connected", async (connectingUserId) => {
      try {
        console.log("User connected event received:", connectingUserId);
        userId = connectingUserId;
        onlineUsers.set(userId, socket.id);
        userHeartbeats.set(userId, Date.now());
        socket.join(userId); //join a personal room for direct emit
        //update user status in db

        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        //notify all users that this user is now online
        broadcastUserStatus(userId, true);
      } catch (error) {
        console.error("Error handling user connection", error);
      }
    });

    // Handle heartbeat from client
    socket.on("heartbeat", () => {
      if (userId) {
        userHeartbeats.set(userId, Date.now());
        console.log(`Heartbeat received from user ${userId}`);
      }
    });

    socket.on("get_user_status", (requestedUserId, callback) => {
      const isOnline = onlineUsers.has(requestedUserId);
      console.log(
        "get_user_status requested for:",
        requestedUserId,
        "Online:",
        isOnline
      );
      callback({
        userId: requestedUserId,
        isOnline,
        lastSeen: isOnline ? new Date() : null,
      });
    });

    // Handle typing start event
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;
      if (!typingUsers.has(userId)) typingUsers.set(userId, {});
      const userTyping = typingUsers.get(userId);
      userTyping[conversationId] = true;
      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
      }
      userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        userTyping[conversationId] = false;
        io.to(receiverId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }, 3000);

      io.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    // Handle typing stop event
    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;
      if (typingUsers.has(userId)) {
        const userTyping = typingUsers.get(userId);
        userTyping[conversationId] = false;
        if (userTyping[`${conversationId}_timeout`]) {
          clearTimeout(userTyping[`${conversationId}_timeout`]);
          delete userTyping[`${conversationId}_timeout`];
        }
      }

      io.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    const handleDisconnected = async () => {
      console.log("User disconnected:", userId);
      if (!userId) return;

      try {
        onlineUsers.delete(userId);
        if (typingUsers.has(userId)) {
          const userTyping = typingUsers.get(userId);
          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith("_timeout")) clearTimeout(userTyping[key]);
          });
          typingUsers.delete(userId);
        }
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        broadcastUserStatus(userId, false);
        socket.leave(userId);
        console.log(`user ${userId} disconnected`);
      } catch (error) {
        console.error(error);
      }
    };

    socket.on("disconnect", handleDisconnected);
  });
  io.socketUserMap = onlineUsers;
  return io;
};
export default initializeSocket;