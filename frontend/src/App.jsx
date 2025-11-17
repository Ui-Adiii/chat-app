import React from "react";
import AppRouter from "./routes/app.route";
import { ToastContainer } from "react-toastify";

const App = () => {
  return (
    <>
      <ToastContainer />
      <AppRouter />
    </>
  );
};

export default App;
