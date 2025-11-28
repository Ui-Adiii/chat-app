import { CHECK_AUTH_URL, GET_ALL_USER_URL, LOGOUT_URL, SEND_OTP_URL, UPDATE_PROFILE_URL, VERIFY_OTP_URL } from "../utils/constant";
import axiosInstance from "./url.service";

const sendOtp = async (email) => {
  try {
    const response = await axiosInstance.post(SEND_OTP_URL, { email });
    return response.data;
  } catch (error) {
    // Return a consistent error structure
    return {
      status: "error",
      message:
        error.response?.data?.message ||
        "Failed to send OTP. Please try again.",
    };
  }
};

const verifyOtp = async (email, otp) => {
  try {
    const response = await axiosInstance.post(VERIFY_OTP_URL, { email, otp });
    return response.data;
  } catch (error) {
    // Return a consistent error structure
    return {
      status: "error",
      message:
        error.response?.data?.message ||
        "Failed to verify OTP. Please try again.",
    };
  }
};

const updateProfile = async (form) => {
  try {
    const response = await axiosInstance.put(UPDATE_PROFILE_URL, form, {
      headers: {
        "Content-Type": "multipart/form-data", // important for files
      },
    });
    return response.data;
  } catch (error) {
    // Return a consistent error structure
    return {
      status: "error",
      message:
        error.response?.data?.message ||
        "Failed to update profile. Please try again.",
    };
  }
};

const logOut = async () => {
  try {
    const response = await axiosInstance.get(LOGOUT_URL);
    return response.data;
  } catch (error) {
    // Return a consistent error structure
    return {
      status: "error",
      message:
        error.response?.data?.message || "Failed to logout. Please try again.",
    };
  }
};

const checkAuth = async () => {
  try {
    const response = await axiosInstance.get(CHECK_AUTH_URL);
    return response.data;
  } catch (error) {
    // Return a consistent error structure
    return {
      status: "error",
      message: error.response?.data?.message || "Authentication check failed.",
    };
  }
};

const getAllUsers = async () => {
  try {
    const response = await axiosInstance.get(GET_ALL_USER_URL);
    return response.data;
  } catch (error) {
    // Return a consistent error structure
    return {
      status: "error",
      message:
        error.response?.data?.message ||
        "Failed to fetch users. Please try again.",
    };
  }
};

export { sendOtp, verifyOtp, updateProfile, checkAuth, logOut, getAllUsers };