import { GET_CONVERSATIONS_URL, GET_MESSAGES_URL, SEND_MESSAGE_URL, MARK_AS_READ_URL, DELETE_MESSAGE_URL } from "../utils/constant";
import axiosInstance from "./url.service";

const getAllConversations = async () => {
    try {
        const response = await axiosInstance.get(GET_CONVERSATIONS_URL);
        return response.data;
    } catch (error) {
        return error?.response?.data || { message: error.message };
    }
};

const getMessages = async (conversationId) => {
    try {
        const response = await axiosInstance.get(`${GET_MESSAGES_URL}/${conversationId}/messages`);
        return response.data;
    } catch (error) {
        return error?.response?.data || { message: error.message };
    }
};

const sendMessage = async (formData) => {
    try {
        const response = await axiosInstance.post(SEND_MESSAGE_URL, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        return error?.response?.data || { message: error.message };
    }
};

const markAsRead = async (messageIds) => {
    try {
        const response = await axiosInstance.put(MARK_AS_READ_URL, { messageIds });
        return response.data;
    } catch (error) {
        return error?.response?.data || { message: error.message };
    }
};

const deleteMessage = async (messageId) => {
    try {
        const response = await axiosInstance.delete(`${DELETE_MESSAGE_URL}/${messageId}`);
        return response.data;
    } catch (error) {
        return error?.response?.data || { message: error.message };
    }
};

export { getAllConversations, getMessages, sendMessage, markAsRead, deleteMessage };

