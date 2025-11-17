import { CHECK_AUTH_URL, GET_ALL_USER_URL, LOGOUT_URL, SEND_OTP_URL, UPDATE_PROFILE_URL, VERIFY_OTP_URL } from "../utils/constant";
import axiosInstance from "./url.service";

const sendOtp =async(email)=>{
    try {
        const response =await axiosInstance.post(SEND_OTP_URL,{email});
        return response.data;
    } catch (error) {
        return error?.message
    }
}
const verifyOtp =async ( email,otp)=>{
    try {
        const response =await axiosInstance.post(VERIFY_OTP_URL,{email,otp});
        return response.data;
    } catch (error) {
        return error?.message
    }
}


const updateProfile =async (form)=>{
    try {
const response = await axiosInstance.put(UPDATE_PROFILE_URL, form, {
      headers: {
        "Content-Type": "multipart/form-data", // important for files
      },
    });
        return response.data;
    } catch (error) {
        return error?.message
    }
}


const logOut =async ()=>{
    try {
        const response =await axiosInstance.get(LOGOUT_URL);
        return response.data;
    } catch (error) {
        return error?.message
    }
}


const checkAuth =async ()=>{
    try {
        const response =await axiosInstance.get(CHECK_AUTH_URL);
        return response.data;
    } catch (error) {
        return error?.message
    }
}

const getAllUsers = async () => {
    try {
        const response =await axiosInstance.get(GET_ALL_USER_URL);
        return response.data
    } catch (error) {
        return error?.message
    }
}

export {sendOtp,verifyOtp,updateProfile,checkAuth,logOut,getAllUsers}