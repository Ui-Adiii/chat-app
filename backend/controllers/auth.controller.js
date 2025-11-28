import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import sendOtpToEmail from "../services/email.service.js";
import {
  sendOtpToPhoneNumber,
  verifyOtpService,
} from "../services/phone.service.js";
import cloudinaryUpload from "../services/cloudinary.service.js";
import { generateToken } from "../utils/generateToken.js";
import otpGenerator from "../utils/otpGenerator.js";
import response from "../utils/responseHandler.js";
import uploadFileImageKit from "../services/imagekit.service.js";


const sendOtp = async (req, res) => {
  const { email } = req.body;

  // Validate email format
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response(res, 400, "Valid email is required");
  }

  try {
    // Check if user already requested OTP recently (cooldown period)
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.emailOtpExpiry) {
      const now = new Date();
      // If OTP is still valid (within 5 minutes), check if it was requested recently
      if (now < existingUser.emailOtpExpiry) {
        // Check if the last OTP was requested less than 1 minute ago
        const timeSinceLastRequest =
          now.getTime() -
          (existingUser.emailOtpExpiry.getTime() - 5 * 60 * 1000);
        const minutesSinceLastRequest = Math.floor(
          timeSinceLastRequest / (1000 * 60)
        );

        // If less than 1 minute since last request, reject
        if (minutesSinceLastRequest < 1) {
          return response(
            res,
            429,
            "Please wait before requesting another OTP"
          );
        }
      }
    }

    const otp = await otpGenerator();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
    let user;

    if (email) {
      user = await User.findOne({ email });
      if (!user) {
        user = await User.create({ email });
      }
      user.emailOtp = otp;
      user.emailOtpExpiry = expiry;

      await user.save();

      await sendOtpToEmail(email, otp);
      

      return response(res, 200, "OTP sent to your email", { email });
    }
  } catch (error) {
    console.error("Send OTP Error:", error);
    return response(res, 500, "Failed to send OTP. Please try again later.");
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  // Validate input
  if (!email || !otp) {
    return response(res, 400, "Email and OTP are required");
  }

  try {
    let user;
    if (email) {
      user = await User.findOne({ email });

      if (!user) {
        return response(res, 404, "User not found");
      }

      const now = new Date();
      if (
        !user.emailOtp ||
        String(user.emailOtp) !== String(otp) ||
        now > new Date(user.emailOtpExpiry)
      ) {
        return response(res, 400, "Invalid or expired OTP");
      }
      user.isVerified = true;
      user.emailOtp = null;
      user.emailOtpExpiry = null;
      await user.save();
    }

    const token = generateToken(user?._id);

    res.cookie("auth_token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      domain: process.env.COOKIE_DOMAIN || undefined,
    });
    return response(res, 200, "OTP verified successfully", { token, user });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return response(res, 500, "Failed to verify OTP. Please try again later.");
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, agreed, about } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const file = req.file;

    if (file) {
      const result = await cloudinaryUpload(file);

      user.profilePicture = result;
    }
    if (username) user.username = username;
    if (agreed) user.agreed = agreed;
    if (about) user.about = about;
    await user.save();
    response(res, 200, "Updated successfully", user);
  } catch (error) {
    return response(res, 500, error.message);
  }
};

const logout = (req, res) => {
  try {
    res.cookie("auth_token", "", {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      domain: process.env.COOKIE_DOMAIN || undefined,
    });
    return response(res, 200, "Logout successfully");
  } catch (error) {
    return response(res, 500, error.message);
  }
};

const checkAuthenticatedUser = async (req, res) => {
  try {
    const { userId } = req.user;

    if (!userId) return response(res, 401, "Unauthorized user");
    const user = await User.findById(userId);
    if (!user) return response(res, 401, "User not found");
    return response(res, 200, "User retrieved", user);
  } catch (error) {
    return response(res, 500, error.message);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const loggedInUser = req.user.userId;
    const users = await User.find({
      _id: {
        $ne: loggedInUser,
      },
    })
      .select("username profilePicture lastSeen isOnline about email")
      .lean();

    const usersWithConversation = await Promise.all(
      users.map(async (user) => {
        const conversation = await Conversation.findOne({
          participants: {
            $all: [loggedInUser, user?._id],
          },
        })
          .populate({
            path: "lastMessage",
            select: "content createdAt sender receiver",
          })
          .lean();
        return {
          ...user,
          conversation: conversation || null,
        };
      })
    );
    return response(res, 200, "Retrieved all users", usersWithConversation);
  } catch (error) {
    return response(res, 500, error.message);
  }
};

export {
  sendOtp,
  verifyOtp,
  updateProfile,
  logout,
  getAllUsers,
  checkAuthenticatedUser,
};