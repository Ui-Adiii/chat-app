import jwt from "jsonwebtoken"
import dotenv from 'dotenv';
dotenv.config()
const generateToken = (userId) =>{
    return jwt.sign({userId},process.env.JWT_SECRET,{
        expiresIn:'1y'
    })
}
export {generateToken}