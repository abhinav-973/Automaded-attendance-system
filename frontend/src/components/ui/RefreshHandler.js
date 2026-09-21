import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "../../services/axiosInstance.js";
import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
} from "../../utils/auth.js";

const getSessionUser = (token, teacher) => {
  if (teacher) return teacher;

  const decoded = jwtDecode(token);
  const storedUser = getStoredUser();

  return {
    ...storedUser,
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
  };
};

const isTokenValid = (token) => {
  try {
    const decoded = jwtDecode(token);
    return Boolean(decoded.exp && decoded.exp * 1000 > Date.now());
  } catch {
    return false;
  }
};

const RefreshHandler = ({ setAuthState }) => {
  useEffect(() => {
    let isMounted = true;

    const setUnauthenticated = () => {
      localStorage.removeItem("accessToken");
      clearStoredUser();
      if (!isMounted) return;
      setAuthState({ isAuthenticated: false, user: null, isReady: true });
    };

    const restoreSession = async () => {
      let token = localStorage.getItem("accessToken");

      if (!token || !isTokenValid(token)) {
        try {
          const response = await axiosInstance.get("/auth/refresh");
          token = response.data?.accessToken;

          if (!token || !isTokenValid(token)) {
            throw new Error("Invalid refresh response");
          }

          localStorage.setItem("accessToken", token);
          const user = getSessionUser(token, response.data?.teacher);
          setStoredUser(user);

          if (isMounted) {
            setAuthState({ isAuthenticated: true, user, isReady: true });
          }
          return;
        } catch {
          setUnauthenticated();
          return;
        }
      }

      const user = getSessionUser(token);
      setStoredUser(user);
      if (isMounted) {
        setAuthState({ isAuthenticated: true, user, isReady: true });
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [setAuthState]);

  return null;
};

export default RefreshHandler;
