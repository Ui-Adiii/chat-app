import { Router } from "express";
import {
  checkAuthenticatedUser,
  getAllUsers,
  logout,
  updateProfile,
  login, // Import new login function
  register, // Import new register function
} from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

// Routes for password-based authentication
router.post("/login", login);
router.post("/register", register);
router.put(
  "/update-profile",
  authMiddleware,
  upload.single("profilePicture"),
  updateProfile
);
router.get("/logout", authMiddleware, logout);
router.get("/check-auth", authMiddleware, checkAuthenticatedUser);
router.get("/get-all-users", authMiddleware, getAllUsers);

export default router;