import { Server } from "socket.io";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

//map for online users => (userId ,SocketIs)

const onlineUsers = new Map();

//map to track typing status -> userId -> [conversation]:boolean
const typingUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // List of allowed origins
        const allowedOrigins = [
          "http://localhost:5173",
          "https://your-production-domain.com",
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
        socket.join(userId); //join a personal room for direct emit
        //update user status in db

        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        //notify all users that this user is now online
        io.emit("user_status", { userId, isOnline: true });
      } catch (error) {
        console.error("Error handling user connection", error);
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
        io.emit("user_status", {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });
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