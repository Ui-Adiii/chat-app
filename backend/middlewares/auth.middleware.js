import response from '../utils/responseHandler.js';
import jwt from 'jsonwebtoken';
const authMiddleware = async (req,res,next)=> {
    try {
        const authToken = req.cookies?.auth_token;
        if(!authToken) return response(req,401,'unauthorized user');
        const decoded = jwt.verify(authToken,process.env.JWT_SECRET)
        if(!decoded)return response(req,401,'unauthorized user');
        req.user=decoded;
        
        next();
    } catch (error) {
        response(req,401,error.message);
    }
}
export default authMiddleware