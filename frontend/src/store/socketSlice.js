const createSocketSlice = (set) => ({
  socket: null,
  isConnected: false,
  setSocket: (socket) => set({ socket, isConnected: socket?.connected || false }),
  setIsConnected: (isConnected) => set({ isConnected }),
  clearSocket: () => set({ socket: null, isConnected: false }),
});

export default createSocketSlice;

