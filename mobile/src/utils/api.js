import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const rawBaseURL = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "https://heka-lab.onrender.com/";
const normalizedBase = rawBaseURL.replace(/\/$/, "");
const baseURL = normalizedBase.endsWith("/api") ? normalizedBase : `${normalizedBase}/api`;

const API = axios.create({
  baseURL
});

API.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Failed to load auth token:", e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
