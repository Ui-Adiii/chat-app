import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import Home from "@/pages/home/Home";
import useStore from "@/store/useStore";
import { PrivateRoute, PublicRoute } from "./Route";

const AppRouter = () => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  return (
    <Router>
      <Routes>
       <Route element={<PrivateRoute isAuthenticated={isAuthenticated}/>}>
        <Route path="/" element={<Home />} />
       </Route>

       <Route element={<PublicRoute isAuthenticated={isAuthenticated}/>}>
        <Route path="/login" element={<Login />} />
       </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;
