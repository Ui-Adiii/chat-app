const createStatusSlice = (set) => ({
  statuses: [],
  setStatuses: (statuses) => set({ statuses }),
  addStatus: (status) =>
    set((state) => ({
      statuses: [status, ...state.statuses.filter((s) => s._id !== status._id)],
    })),
  removeStatus: (statusId) =>
    set((state) => ({
      statuses: state.statuses.filter((s) => s._id !== statusId),
    })),
  updateStatus: (statusId, updates) =>
    set((state) => ({
      statuses: state.statuses.map((s) => (s._id === statusId ? { ...s, ...updates } : s)),
    })),
  clearStatuses: () => set({ statuses: [] }),
});

export default createStatusSlice;

