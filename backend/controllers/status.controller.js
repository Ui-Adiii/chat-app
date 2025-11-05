import Conversation from "../models/conversation.model.js";
import Status from "../models/status.model.js";
import cloudinaryUpload from "../utils/cloudinaryUpload.js";
import response from "../utils/responseHandler.js";

const createStatus = async (req, res) => {
  try {
    const { content, contentType } = req.body;

    const userId = req.user.userId;

    const file = req.file;
    if (!file && (!content || content?.trim() === "")) {
      return response(res, 400, "something is missing");
    }
    let mediaUrl = null;
    let finalContentType = contentType || "text";
    // console.log(file.mimetype)
    if (file) {
      mediaUrl = await cloudinaryUpload(file);
      finalContentType = file.mimetype.startsWith("video") ? "video" : "image";
    } else {
      finalContentType = "text";
    }
    const expiryAt = new Date();
    expiryAt.setHours(expiryAt.getHours() + 24);
    console.log(finalContentType);
    const status = await Status.create({
      user: userId,
      content: mediaUrl || content,
      contentType: finalContentType,
      expiryAt,
    });

    const populatedStatus = await Status.findOne({ _id: status?._id })
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture");

    //Emit Socket event
    if (req.io && req.socketUserMap) {
      //Broadcast to all connecting user
      for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== userId) {
          req.io.to(socketId).emit("new_status", populatedStatus);
        }
      }
    }

    response(res, 201, "status created successfully", populatedStatus);
  } catch (error) {
    response(res, 500, error.message);
  }
};

const getAllStatuses = async (req, res) => {
  try {
    const statuses = await Status.find({
      expiryAt: {
        $gt: new Date(),
      },
    })
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture")
      .sort({ createdAt: -1 });

    return response(res, 200, "status fetched successfully", statuses);
  } catch (error) {
    return response(res, 500, error.message);
  }
};

const viewStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const { userId } = req.user;
    const status = await Status.findById(statusId);
    if (!status) return response(res, 404, "status not found");

    if (!status.viewers.includes(userId)) {
      status.viewers.push(userId);
      await status.save();

      const updatedStatus = await Status.findById(status)
        .populate("user", "username profilePicture")
        .populate("viewers", "username profilePicture");
      if (req.io && req.socketUserMap) {
        const statusOwnerSocketId = req.socketUserMap.get(
          status.user._id.toString()
        );
        if (statusOwnerSocketId) {
          const viewData = {
            statusId,
            viewerId: userId,
            totalViewers: updatedStatus.viewers.length,
            viewers: updatedStatus.viewers,
          };
          req.io(statusOwnerSocketId).emit("status_viewed", viewDat);
        }
      } else {
        console.log("status owner not connected");
      }
    }
    return response(res, 200, "status viewed successfully");
  } catch (error) {
    return response(res, 500, error.message);
  }
};

const deleteStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const { userId } = req.user;
    const status = await Status.findById(statusId);
    if (!status) return response(res, 404, "status not found");

    if (status.user.toString() !== userId)
      return response(res, 403, "not authorized");

    await status.deleteOne();

    if (req.io && req.socketUserMap) {
      for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== userId) {
          req.io.to(socketId).emit("status_deleted", statusId);
        }
      }
    }

    return response(res, 200, "status deleted successfully");
  } catch (error) {
    return response(res, 500, error.message);
  }
};

export { createStatus, deleteStatus, getAllStatuses, viewStatus };
