import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:8000";

let socket = null;

export const initializeSocket = (userId) => {
    if (socket?.connected) {
        return socket;
    }

    socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
        if (userId) {
            socket.emit("user_connected", userId);
        }
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected");
    });

    socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => socket;

export default socket;

