const createConversationSlice = (set) => ({
  conversations: [],
  contacts: [],
  selectedConversation: null,
  setConversations: (conversations) => set({ conversations }),
  setContacts: (contacts) => set({ contacts }),
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations.filter((c) => c._id !== conversation._id)],
    })),
  updateConversation: (conversationId, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, ...updates } : c
      ),
    })),
  updateUserPresence: (userId, { isOnline, lastSeen }) =>
    set((state) => {
      const updateParticipants = (participants = []) =>
        participants.map((participant) =>
          participant._id === userId
            ? { ...participant, isOnline, lastSeen }
            : participant
        );

      const statuses = state.statuses || [];
      return {
        conversations: state.conversations.map((conversation) => ({
          ...conversation,
          participants: updateParticipants(conversation.participants),
        })),
        selectedConversation: state.selectedConversation
          ? {
              ...state.selectedConversation,
              participants: updateParticipants(state.selectedConversation.participants),
            }
          : state.selectedConversation,
        contacts: state.contacts.map((contact) =>
          contact._id === userId ? { ...contact, isOnline, lastSeen } : contact
        ),
        statuses: statuses.map((status) =>
          status.user?._id === userId
            ? {
                ...status,
                user: {
                  ...status.user,
                  isOnline,
                  lastSeen,
                },
              }
            : status
        ),
      };
    }),
  setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),
  clearConversations: () => set({ conversations: [], contacts: [], selectedConversation: null }),
});

export default createConversationSlice;
