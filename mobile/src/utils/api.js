import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Read dynamic API url from env, falling back to local IP address for physical devices
const rawBaseURL = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "http://10.73.28.170:5000";
const baseURL = rawBaseURL.endsWith("/api") ? rawBaseURL : `${rawBaseURL}/api`;

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
