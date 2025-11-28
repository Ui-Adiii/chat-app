import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './db/db.js';
import appRouter from './routes/index.route.js';
import connectCloudinary from './config/cloudinary.config.js';
import initializeSocket from "./services/socket.service.js";
import http from "http";
import { globalLimiter, otpLimiter } from "./utils/limiter.js";

dotenv.config();
connectDB();
connectCloudinary();
const app = express();
const PORT = process.env.PORT || 5000;
app.set("trust proxy", 1);
  app.use(
    cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

app.use(globalLimiter);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = initializeSocket(server);
//socket middleware before route
app.use((req, res, next) => {
  req.io = io;
  req.socketUserMap = io.socketUserMap;
  next();
});

app.get("/", (req, res) => {
  return res.json({
    status: "success",
    message: "API Working",
  });
});

// Apply specific limiters to routes in the router files
app.use("/api", appRouter);

server.listen(PORT, () => console.log(`server started on ${PORT}`));