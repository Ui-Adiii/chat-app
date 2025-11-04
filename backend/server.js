import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './db/db.js';
import authRouter from './routes/auth.route.js';
import messageRouter from './routes/message.route.js';
import connectCloudinary from './config/cloudinary.config.js';

dotenv.config();
connectDB();
connectCloudinary()
const app =  express();
const PORT = process.env.PORT || 5000

app.use(cors({
    origin: process.env.FRONTEND_URL||'http://localhost:5173',
    methods:["POST","GET","PATCH","PUT","DELETE"]
}))

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.get("/",(req,res)=>{
    return res.json({
        success:true,
        message:"APi Working"
    })
})
app.use("/api/auth",authRouter);
app.use("/api/chat",messageRouter);

app.listen(PORT ,()=> console.log(`server started on ${PORT}`))