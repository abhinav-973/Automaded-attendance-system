import axios from "axios";
import { clearStoredUser } from "../utils/auth.js";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 30000,
});

let refreshPromise;

const clearAuthStorage = () => {
  localStorage.removeItem("accessToken");
  clearStoredUser();
};

const refreshAccessToken = async () => {
  const response = await axiosInstance.get("/auth/refresh");
  const accessToken = response.data?.accessToken;

  if (!accessToken) {
    throw new Error("Refresh response did not include an access token");
  }

  localStorage.setItem("accessToken", accessToken);
  return accessToken;
};

// 🔐 REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 🔄 RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    // 🔥 Prevent infinite loop + skip refresh endpoint
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = undefined;
        });

        const accessToken = await refreshPromise;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        clearAuthStorage();
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
