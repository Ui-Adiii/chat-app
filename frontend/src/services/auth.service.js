import {
  CHECK_AUTH_URL,
  GET_ALL_USER_URL,
  LOGOUT_URL,
  UPDATE_PROFILE_URL,
  LOGIN_URL,
  REGISTER_URL,
} from "../utils/constant";
import axiosInstance from "./url.service";

// New login function
const login = async (email, password) => {
  try {
    const response = await axiosInstance.post(LOGIN_URL, { email, password });
    return response.data;
  } catch (error) {
    // Return a consistent error structure
    return {
      status: "error",
      message:
        error.response?.data?.message || "Failed to login. Please try again.",
    };
  }
};

// New register function
const register = async (email, password) => {
  try {
    const response = await axiosInstance.post(REGISTER_URL, {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    // Return a consistent error structure
    return {
      status: "error",
      message:
        error.response?.data?.message ||
        "Failed to register. Please try again.",
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

export { updateProfile, checkAuth, logOut, getAllUsers, login, register };
