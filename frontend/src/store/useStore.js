import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import createLoginSlice from "./loginSlice";
import createUserSlice from "./userSlice";
import createThemeSlice from "./themeSlice";
import createConversationSlice from "./conversationSlice";
import createMessageSlice from "./messageSlice";
import createStatusSlice from "./statusSlice";
import createSocketSlice from "./socketSlice";
import createTypingSlice from "./typingSlice";

const useStore = create(
  devtools(
    persist(
      (...a) => ({
        ...createLoginSlice(...a),
        ...createUserSlice(...a),
        ...createThemeSlice(...a),
        ...createConversationSlice(...a),
        ...createMessageSlice(...a),
        ...createStatusSlice(...a),
        ...createSocketSlice(...a),
        ...createTypingSlice(...a),
      }),
      {
        name: "app-storage",
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          theme: state.theme,
        }),
      }
    )
  )
);
export default useStore;
