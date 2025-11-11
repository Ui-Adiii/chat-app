import express from 'express';
import authRouter from "./auth.route.js";
import messageRouter from './message.route.js';
import statusRouter from './status.route.js';


const router = express.Router();

router.use("/auth",authRouter);
router.use("/chat",messageRouter);
router.use("/status",statusRouter);

export default router