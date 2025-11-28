import { CREATE_STATUS_URL, GET_STATUSES_URL, VIEW_STATUS_URL, DELETE_STATUS_URL } from "../utils/constant";
import axiosInstance from "./url.service";

const createStatus = async (formData) => {
    try {
        const response = await axiosInstance.post(CREATE_STATUS_URL, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        return error?.response?.data || { message: error.message };
    }
};

const getAllStatuses = async () => {
    try {
        const response = await axiosInstance.get(GET_STATUSES_URL);
        return response.data;
    } catch (error) {
        return error?.response?.data || { message: error.message };
    }
};

const viewStatus = async (statusId) => {
    try {
        const response = await axiosInstance.put(`${VIEW_STATUS_URL}/${statusId}/view`);
        return response.data;
    } catch (error) {
        return error?.response?.data || { message: error.message };
    }
};

const deleteStatus = async (statusId) => {
    try {
        const response = await axiosInstance.delete(`${DELETE_STATUS_URL}/${statusId}`);
        return response.data;
    } catch (error) {
        return error?.response?.data || { message: error.message };
    }
};

export { createStatus, getAllStatuses, viewStatus, deleteStatus };

