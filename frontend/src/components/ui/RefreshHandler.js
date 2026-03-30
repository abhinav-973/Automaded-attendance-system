import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance.js";
import { clearStoredUser, setStoredUser } from "../../utils/auth.js";

const RefreshHandler = ({ setAuthState }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const response = await axiosInstance.get("/auth/me");

        if (!isMounted || !response.data.success) {
          return;
        }

        setStoredUser(response.data.teacher);
        setAuthState({
          isAuthenticated: true,
          user: response.data.teacher,
          isReady: true,
        });

        if (location.pathname === "/login" || location.pathname === "/register") {
          navigate("/dashboard", { replace: true });
        }
      } catch {
        if (!isMounted) {
          return;
        }

        clearStoredUser();
        setAuthState({
          isAuthenticated: false,
          user: null,
          isReady: true,
        });
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, navigate, setAuthState]);

  return null;
};

export default RefreshHandler;
