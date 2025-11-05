import {Router} from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';
import { createStatus, getAllStatuses ,viewStatus ,deleteStatus } from '../controllers/status.controller.js';

const router = Router();
router.post("/create-status",authMiddleware,upload.single('status') ,createStatus);
router.get("/get-statuses",authMiddleware,getAllStatuses);
router.put("/:statusId/view",authMiddleware,viewStatus);
router.delete("/:statusId",authMiddleware,deleteStatus);



export default router