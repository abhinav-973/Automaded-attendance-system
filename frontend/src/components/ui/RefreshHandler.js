import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { getStoredUser } from "../../utils/auth.js";

const RefreshHandler = ({ setAuthState }) => {
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    // ❌ No token stored = not authenticated
    if (!token) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isReady: true,
      });
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const now = Date.now();
      const expiresAt = decoded.exp * 1000;

      // ❌ Token expired = clear and mark as unauthenticated
      if (expiresAt < now) {
        localStorage.removeItem("accessToken");
        setAuthState({
          isAuthenticated: false,
          user: null,
          isReady: true,
        });
        return;
      }

      // ✅ Token valid = get stored user and authenticate
      const storedUser = getStoredUser();
      
      setAuthState({
        isAuthenticated: true,
        user: storedUser || decoded,
        isReady: true,
      });
    } catch (err) {
      // ❌ Invalid token format = clear and unauthenticate
      console.error("Token validation error:", err);
      localStorage.removeItem("accessToken");
      setAuthState({
        isAuthenticated: false,
        user: null,
        isReady: true,
      });
    }
  }, [setAuthState]);

  return null; // This is a logic-only component
};

export default RefreshHandler;