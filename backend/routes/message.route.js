import {Router} from 'express';
import {deleteMessage,markAsRead,sendMessage, getAllConversation, getMessages } from '../controllers/message.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';

const router = Router();

router.post("/send-message",authMiddleware,sendMessage)
router.get("/conversations",authMiddleware,getAllConversation);
router.get("/conversations/:conversationId/messages",authMiddleware,getMessages);

router.put("/message/read",authMiddleware,markAsRead);

router.delete("/message/:messageId",authMiddleware,deleteMessage);


export default router