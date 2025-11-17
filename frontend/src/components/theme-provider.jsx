import { useEffect } from "react";
import useStore from "@/store/useStore";

const ThemeProvider = ({ children }) => {
  const { theme } = useStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    const applyTheme = () => {
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    };
    applyTheme();
  }, [theme]);

  return <>{children}</>;
};

export default ThemeProvider;
