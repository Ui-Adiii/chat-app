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
  const { phoneNumber, phoneSuffix, email } = req.body;
  const otp = await otpGenerator();
  const expiry = new Date(Date.now() + 5 * 60 * 1000);
  let user;
  try {
    if (email) {
      user = await User.findOne({ email });
      if (!user) {
        user = await User.create({ email });
      }
      user.emailOtp = otp;
      user.emailOtpExpiry = expiry;

      await user.save();

      await sendOtpToEmail(email, otp);

      return response(res, 200, "Otp send to your email", { email });
    }
    if (!phoneNumber || !phoneSuffix) {
      return response(res, 400, "phone number and phone suffix are required");
    }
    const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
    user = await User.findOne({ phoneNumber });
    if (!user) {
      user = await User.create({ phoneNumber, phoneSuffix });
    }
    await user.save();

    await sendOtpToPhoneNumber(fullPhoneNumber);

    return response(res, 200, "Otp send to your phone number", user);
  } catch (error) {
    return response(res, 500, error.message);
  }
};

const verifyOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email, otp } = req.body;
  try {
    let user;
    if (email) {
      user = await User.findOne({ email });
      if (!user) {
        return response(res, 404, "user not found");
      }
      const now = new Date();
      if (
        !user.emailOtp ||
        String(user.emailOtp) !== String(otp) ||
        now > new Date(user.emailOtpExpiry)
      ) {
        return response(res, 400, "invalid otp");
      }
      user.isVerified = true;
      user.emailOtp = null;
      user.emailOtpExpiry = null;
      await user.save();
    } else {
      if (!phoneNumber || !phoneSuffix) {
        return response(res, 400, "phone number and phone suffix are required");
      }
      const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
      user = await User.findOne({ phoneNumber });

      if (!user) {
        return response(res, 404, "user not found");
      }

      const result = await verifyOtpService(fullPhoneNumber, otp);
      if (result.status !== "approved") {
        return response(res, 400, "invalid otp");
      }
      user.isVerified = true;
      await user.save();
    }
    const token = generateToken(user?._id);
    res.cookie("auth_token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    return response(res, 200, "otp verified successfully", { token, user });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, agreed, about } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const file = req.file;
    if (file) {
      const result = await uploadFileImageKit(file);
      user.profilePicture = result;
    } else if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture;
    }
    if (username) user.username = username;
    if (agreed) user.agreed = agreed;
    if (about) user.about = about;
    await user.save();
    response(res, 200, "updated successfully", user);
  } catch (error) {
    return response(res, 500, error.message);
  }
};

const logout = (req, res) => {
  try {
    res.cookie("auth_token", "");
    return response(res, 200, "logout successfully");
  } catch (error) {
    return response(res, 500, error.message);
  }
};

const checkAuthenticatedUser = async (req, res) => {
  try {
    const { userId } = req.user;
    if (!userId) return response(res, 401, "unauthorized user");
    const user = await User.findById(userId);
    if (!user) return response(res, 401, "user not found");
    return response(res, 200, "user retrieved", user);
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
    }).select("username profilePicture lastSeen isOnline about phoneNumber phoneSuffix").lean();
    
    const usersWithConversation = await Promise.all(
      users.map(async(user)=>{
        const conversation = await Conversation.findOne(
          {
            participants:{
              $all:[loggedInUser,user?._id]
            }
          }
        ).populate({
          path:"lastMessage",
          select:"content createdAt sender receiver"
        }).lean()
        return{
          ...user,
          conversation:conversation | null
        }
      })
    )
    return response(res, 200, 'retrieved all users',usersWithConversation);

  } catch (error) {
    return response(res, 500, error.message);
  }
};

export { sendOtp, verifyOtp, updateProfile, logout,getAllUsers, checkAuthenticatedUser };
