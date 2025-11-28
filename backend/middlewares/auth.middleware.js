import response from '../utils/responseHandler.js';
import jwt from 'jsonwebtoken';
const authMiddleware = async (req,res,next)=> {
    try {
        const authToken = req.cookies?.auth_token;
        
        if(!authToken) return response(res,401,'unauthorized user');
        const decoded = jwt.verify(authToken,process.env.JWT_SECRET)
        
        if(!decoded)return response(res,401,'unauthorized user');
        req.user=decoded;
        next();
    } catch (error) {
        response(res,401,error.message);
    }
}
export default authMiddleware
