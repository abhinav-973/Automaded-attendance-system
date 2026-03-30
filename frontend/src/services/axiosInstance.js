import axios from "axios";

const normalizeBaseUrl = (baseUrl) => (baseUrl || "http://localhost:5000").replace(/\/+$/, "");

const axiosInstance = axios.create({
    baseURL: normalizeBaseUrl(import.meta.env.VITE_API_URL),
    withCredentials: true,
    timeout: 30000,
});

export default axiosInstance;
