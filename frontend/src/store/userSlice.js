const createUserSlice = (set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (userData) => set({ user: userData, isAuthenticated: true }),
  clearUser: () => set({  user: null, isAuthenticated: false }),
});
export default createUserSlice;
