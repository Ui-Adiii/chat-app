import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import cloudinaryUpload from "../services/cloudinary.service.js";
import { generateToken } from "../utils/generateToken.js";
import response from "../utils/responseHandler.js";
import uploadFileImageKit from "../services/imagekit.service.js";
import bcrypt from "bcrypt"; // Added bcrypt for password hashing

// New login function for password-based authentication
const login = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return response(res, 400, "Email and password are required");
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return response(res, 404, "User not found");
    }

    // Check if user has a password
    if (!user.password) {
      return response(res, 400, "Invalid credentials");
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return response(res, 401, "Invalid credentials");
    }

    // Update user verification status
    user.isVerified = true;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.cookie("auth_token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      domain: process.env.COOKIE_DOMAIN || undefined,
    });

    return response(res, 200, "Login successful", { token, user });
  } catch (error) {
    console.error("Login Error:", error);
    return response(res, 500, "Failed to login. Please try again later.");
  }
};

// New register function for password-based registration
const register = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return response(res, 400, "Email and password are required");
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response(res, 400, "Valid email is required");
  }

  // Validate password strength (at least 6 characters)
  if (password.length < 6) {
    return response(res, 400, "Password must be at least 6 characters long");
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.password) {
        return response(res, 400, "User already exists. Please login.");
      } else {
        // User exists but registered with OTP, update with password
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUser.password = hashedPassword;
        await existingUser.save();
        return response(res, 200, "Password set successfully", {
          user: existingUser,
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with password
    const user = await User.create({
      email,
      password: hashedPassword,
      isVerified: true, // Password users are automatically verified
    });

    // Generate token
    const token = generateToken(user._id);

    res.cookie("auth_token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      domain: process.env.COOKIE_DOMAIN || undefined,
    });

    return response(res, 201, "Registration successful", { token, user });
  } catch (error) {
    console.error("Registration Error:", error);
    return response(res, 500, "Failed to register. Please try again later.");
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
  updateProfile,
  logout,
  getAllUsers,
  checkAuthenticatedUser,
  login, // Export new login function
  register, // Export new register function
};