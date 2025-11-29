const createMessageSlice = (set) => ({
  messages: {},
  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),
  addMessage: (conversationId, message) =>
    set((state) => {
      console.log("Adding message to conversation:", conversationId, message);
      const newState = {
        messages: {
          ...state.messages,
          [conversationId]: [
            ...(state.messages[conversationId] || []),
            message,
          ],
        },
      };
      console.log("New messages state:", newState.messages[conversationId]);
      return newState;
    }),
  updateMessage: (conversationId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((m) =>
          m._id === messageId ? { ...m, ...updates } : m
        ),
      },
    })),
  deleteMessage: (conversationId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).filter(
          (m) => m._id !== messageId
        ),
      },
    })),
  clearMessages: () => set({ messages: {} }),
});

export default createMessageSlice;

