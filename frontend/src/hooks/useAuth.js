import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "@/store/useStore";
import { checkAuth } from "@/services/auth.service";

export const useAuth = () => {
  const { user, setUser, isAuthenticated } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated) {
        try {
          const response = await checkAuth();
          if (response.status === "success" && response.data) {
            setUser(response.data);
          } else {
            navigate("/login");
          }
        } catch (error) {
          navigate("/login");
        }
      }
    };

    verifyAuth();
  }, [isAuthenticated, setUser, navigate]);

  return { user, isAuthenticated };
};

