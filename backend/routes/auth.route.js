import {Router} from 'express';
import { checkAuthenticatedUser, getAllUsers, logout, sendOtp, updateProfile, verifyOtp } from '../controllers/auth.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';

const router = Router();

router.post("/send-otp",sendOtp)
router.post("/verify-otp",verifyOtp)
router.put("/update-profile",authMiddleware,upload.single('profilePicture'),updateProfile);
router. get("/logout",authMiddleware,logout);
router. get("/check-auth",authMiddleware,checkAuthenticatedUser);
router. get("/get-all-users",authMiddleware,getAllUsers);


export default router