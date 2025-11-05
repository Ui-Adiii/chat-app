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
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
      methods: ["POST", "GET", "PATCH", "PUT", "DELETE", "OPTION"],
    },
    pingTimeout: 60 * 1000, //disconnect inactive users or sockets after 1 mint
  });

  //when a new socket connection established
  io.on("connection", (socket) => {
    console.log(`user connected: ${socket.id}`);
    let userId = null;

    socket.on("user_connected", async (connectingUserId) => {
      try {
        
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
      callback({
        userId: requestedUserId,
        isOnline,
        lastSeen: isOnline ? new Date() : null,
      });
    });

    socket.on("send_message", async (msg) => {
      try {
        const receiverSocketId = onlineUsers.get(msg.receiver?._id);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiver_message", msg);
        }
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("message_read", async ({ messageIds, senderId }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { messageStatus: "read" } }
        );

        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          messageIds.forEach((msgId) => {
            msgId.to(senderSocketId).emit("message_status_update", {
              messageIds,
              messageStatus: "read",
            });
          });
        }
      } catch (error) {
        console.error(error);
      }
    });

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
        socket.to(receiverId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }, 3000);

      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: true,
      });
    });

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

      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    socket.on(
      "add_reaction",
      async ({ messageId, emoji, userId, reactionUserId }) => {
        try {
          const message = await Message.findById(messageId);
          if (!message) return;
          const existingIndex = message.reaction.findIndex(
            (r) => r.user.toString() === reactionUserId
          );
          if (existingIndex > -1) {
            const existing = message.reaction(existingIndex);
            if (existing.emoji === emoji) {
              message.reactions.splice(existingIndex, 1);
            } else {
              message.reactions[existingIndex].emoji = emoji;
            }
          } else {
            message.reactions.push({ user: reactionUserId, emoji });
          }
          await message.save();
          const populatedMessage = await Message.findOne({ _id: message._id })
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")
            .populate("reaction.user", "username");

          const reactionUpdate = {
            messageId,
            reaction: populatedMessage.reactions,
          };

          const senderSocket = onlineUsers.get(
            populatedMessage.sender._id.toString()
          );
          const receiverSocket = onlineUsers.get(
            populatedMessage.receiver._id.toString()
          );

          if (senderSocket)
            io.to(senderSocket).emit("reaction_update", reactionUpdate);
          if (receiverSocket)
            io.to(receiverSocket).emit("reaction_update", reactionUpdate);
        } catch (error) {
          console.error(error);
        }
      }
    );
    
    const handleDisconnected = async () => {
      if (!userId) return;
      
      try {
        onlineUsers.delete(userId);
        if(typingUsers.has(userId)){
          const userTyping = typingUsers.get(userId);
          Object.keys(userTyping).forEach((key)=>{
           if(key.endsWith("_timeout")) clearTimeout(userTyping[key])
          })
          typingUsers.delete(userId);
        }
        await User.findByIdAndUpdate(userId,{
          isOnline:false,
          lastSeen:new Date()
        })
        io.emit("user_status",{
          userId,
          isOnline:false,
          lastSeen:new Date()
        })
        socket.leave(userId);
        console.log(`user ${userId} disconnected`);
        
      } catch (error) {
        console.error(error);
      }
    
    };

    socket.on("disconnect",handleDisconnected);
  });
  io.socketUserMap = onlineUsers;
  return io;
};
export default initializeSocket;