import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL

let socket = null;

export const initializeSocket = (userId) => {
    if (socket?.connected) {
        return socket;
    }

    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      if (userId) {
        socket.emit("user_connected", userId);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      // Attempt to reconnect manually if automatic reconnection fails
      if (reason === "io server disconnect") {
        // The server disconnected the socket, attempt to reconnect
        socket.connect();
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      // Handle specific connection errors
      if (error.message.includes("timeout")) {
        console.log("Connection timeout, retrying...");
      }
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

