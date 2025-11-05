import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import cloudinaryUpload from "../utils/cloudinaryUpload.js";
import response from "../utils/responseHandler.js";

const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, messageStatus } = req.body;

    const file = req.file;
    if (!file && (!content || content?.trim() === "")) {
      return response(res, 400, "something is missing");
    }
    const participants = [senderId, receiverId].sort();

    let conversation = await Conversation.findOne({ participants });
    if (!conversation) {
      conversation = await Conversation.create({
        participants,
      });
    }
    let imageOrVideoUrl = null;
    let contentType = null;
    if (file) {
      imageOrVideoUrl = await cloudinaryUpload(file);
      contentType = file.mimeType.startsWith("video") ? "video" : "image";
    } else {
      contentType = "text";
    }
    const message = await Message.create({
      sender: senderId,
      conversation: conversation._id,
      receiver: receiverId,
      content,
      contentType,
      imageOrVideoUrl,
      messageStatus,
    });
    if (message?.content) {
      conversation.lastMessage = message._id;
    }
    conversation.unreadCount += 1;
    await conversation.save();

    const populatedMessage = await Message.findOne({ _id: message?._id })
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture");

    if (req.io && req.socketUserMap) {
      const receiverSocketId = req.socketUserMap.get(receiverId);
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("receive_message", populatedMessage);
        message.status = "delivered";
        await message.save();
      }
    }

    response(res, 201, "message send successfully", populatedMessage);
  } catch (error) {
    response(res, 500, error.message);
  }
};

const getAllConversation = async (req, res) => {
  try {
    const userId = req.user.userId;
    let conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "username profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "username profilePicture",
        },
      })
      .sort({ updatedAt: -1 });
    return response(res, 200, "conversation get successfully", conversations);
  } catch (error) {
    return response(res, 500, error.message);
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return response(res, 404, "conversation not found");

    if (!conversation.participants.includes(userId))
      return response(res, 403, "not authorized to view this conversation");

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .sort("createdAt");

    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        messageStatus: { $in: ["send", "delivered"] },
      },
      {
        $set: {
          messageStatus: "read",
        },
      }
    );
    conversation.unreadCount = 0;
    await conversation.save();
    return response(res, 200, "message retrieved", messages);
  } catch (error) {
    response(res, 500, error.message);
  }
};

const markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user.userId;
    let messages = await Message.find({
      _id: { $in: messageIds },
      receiver: userId,
    });
    await Message.updateMany(
      {
        _id: { $in: messageIds },
      },
      {
        $set: {
          messageStatus: "read",
        },
      }
    );

    if (req.io && req.socketUserMap) {
      for (const message of messages) {
        const senderSocketId = req.socketUserMap.get(message.sender.toString());
        if (senderSocketId) {
          const updatedMessage = {
            _id: message._id,
            messageStatus: "read",
          };
          req.io.to(senderSocketId).emit("message_read", updatedMessage);
          await message.save();
        }
      }
    }

    return response(res, 200, "message marked as read", messages);
  } catch (error) {
    return response(res, 500, error.message);
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);

    if (!message) return response(res, 404, "message not found");

    if (!message.sender.equals(userId)) {
      return response(res, 403, "not authorized to delete this message");
    }
    await message.deleteOne();
    if (req.io && req.socketUserMap) {
      const receiverSocketId = req.socketUserMap.get(message.receiver.toString);
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("message_deleted", messageId);
      }
    }
    return response(res, 200, "message deleted successfully");
  } catch (error) {
    return response(res, 500, error.message);
  }
};

export {
  deleteMessage,
  markAsRead,
  sendMessage,
  getAllConversation,
  getMessages,
};
