const createTypingSlice = (set) => ({
  typingUsers: {}, // { conversationId: { userId: true/false } }
  setTyping: (conversationId, userId, isTyping) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: {
          ...(state.typingUsers[conversationId] || {}),
          [userId]: isTyping,
        },
      },
    })),
  clearTyping: (conversationId) =>
    set((state) => {
      const newTypingUsers = { ...state.typingUsers };
      delete newTypingUsers[conversationId];
      return { typingUsers: newTypingUsers };
    }),
  clearAllTyping: () => set({ typingUsers: {} }),
});

export default createTypingSlice;

