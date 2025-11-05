import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './db/db.js';
import authRouter from './routes/auth.route.js';
import messageRouter from './routes/message.route.js';
import statusRouter from './routes/status.route.js';
import connectCloudinary from './config/cloudinary.config.js';
import initializeSocket from './services/socket.service.js';
import {rateLimit} from 'express-rate-limit';
import http from 'http';


dotenv.config();
connectDB();
connectCloudinary()
const app =  express();
const PORT = process.env.PORT || 5000
app.use(cors({
    origin: process.env.FRONTEND_URL||'http://localhost:5173',
    methods:["POST","GET","PATCH","PUT","DELETE"],
    credentials:true
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,   
  max: 100,                  
  message: "Too many requests, please try again later.",
  standardHeaders: true,     
  legacyHeaders: false,
});
app.use(limiter)



app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))


const server= http.createServer(app);
const io = initializeSocket(server);
//socket middleware before route
app.use((req,res,next)=>{
    req.io = io ;
    req.socketUserMap= io.socketUserMap;
    next();
})

app.get("/",(req,res)=>{
    return res.json({
        status:"success",
        message:"APi Working"
    })
})
app.use("/api/auth",authRouter);
app.use("/api/chat",messageRouter);
app.use("/api/status",statusRouter);

server.listen(PORT ,()=> console.log(`server started on ${PORT}`))