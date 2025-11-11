import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import createLoginSlice from "./loginSlice";
import createUserSlice from "./userSlice";
import createThemeSlice from "./themeSlice";

const useStore = create(
  devtools(
    persist(
      (...a) => ({
        ...createLoginSlice(...a),
        ...createUserSlice(...a),
        ...createThemeSlice(...a)
      }),
      {
        name: "app-storage",
      }
    )
  )
);
export default useStore;
