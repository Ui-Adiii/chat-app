import Conversation from "../models/conversation.model.js";
import Status from "../models/status.model.js";
import cloudinaryUpload from "../utils/cloudinaryUpload.js";
import response from "../utils/responseHandler.js";

const createStatus = async (req, res) => {
  try {
    const { content } = req.body;
    
    const userId =req.i=user.userId;

    const file = req.file;
    if (!file &&(!content || content?.trim() === "")) {
      return response(res, 400, "something is missing");
    }
    let mediaUrl =null;
    let finalContentType=contentType || 'text';
    if (file) {
      mediaUrl = await cloudinaryUpload(file);
      finalContentType = file.mimeType.startsWith("video") ? "video" : "image";
    } else {
      finalContentType = "text";
    }
    const expiryAt =new Date();
    expiryAt.setHours(expiryAt.getHours()+24)
    const status = await Status.create({
      user:userId,
      content:mediaUrl || content,
      contentType:finalContentType,
      expiryAt
    });


    const populatedStatus = await Status.findOne({ _id: status?._id })
      .populate("user", "username profilePicture")
      .populate("viewer", "username profilePicture");

    response(res, 201, "status created successfully", populatedStatus);
  } catch (error) {
    response(res, 500, error.message);
  }
};

const getAllStatus = async (req, res) => {
  try {
    
  }catch (error) {
    return response(res, 500, error.message);
  }
};

const getMessages = async (req, res) => {
  try {
    
  } catch (error) {
    response(res, 500, error.message);
  }
};

const markAsRead = async (req, res) => {
  try {
    
  } catch (error) {
    return response(res, 500, error.message);
  }
};

const deleteStatus = async (req, res) => {
  try {
    
  } catch (error) {
    return response(res, 500, error.message);
  }
};

export { createStatus,deleteStatus,getAllStatus};
