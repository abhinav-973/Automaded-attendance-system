import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance.js";
import { clearStoredUser, setStoredUser } from "../../utils/auth.js";

const RefreshHandler = ({ setAuthState }) => {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const setUnauthenticated = () => {
      clearStoredUser();
      setAuthState({
        isAuthenticated: false,
        user: null,
        isReady: true,
      });
    };

    const checkAuth = async () => {
      try {
        const response = await axiosInstance.get("/auth/me");

        if (!isMounted) {
          return;
        }

        if (!response.data.success) {
          setUnauthenticated();
          return;
        }

        setStoredUser(response.data.teacher);
        setAuthState({
          isAuthenticated: true,
          user: response.data.teacher,
          isReady: true,
        });

        const currentPath = window.location.pathname;

        if (currentPath === "/" || currentPath === "/login" || currentPath === "/register") {
          navigate("/dashboard", { replace: true });
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const status = error.response?.status;

        if (status === 401 || status === 403 || status === 404) {
          setUnauthenticated();
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate, setAuthState]);

  return null;
};

export default RefreshHandler;
