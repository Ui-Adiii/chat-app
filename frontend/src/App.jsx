import React, { useEffect } from "react";
import AppRouter from "./routes/app.route";
import { ToastContainer } from "react-toastify";
import useStore from "./store/useStore";
import { checkAuth } from "./services/auth.service";

const App = () => {
  const { setUser, isAuthenticated } = useStore();

  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated) {
        try {
          const response = await checkAuth();
          if (response.status === "success" && response.data) {
            setUser(response.data);
          }
        } catch (error) {
          console.error("Auth check failed:", error);
        }
      }
    };

    verifyAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <ToastContainer />
      <AppRouter />
    </>
  );
};

export default App;
