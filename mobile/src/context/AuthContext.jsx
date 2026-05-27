import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const token = await AsyncStorage.getItem("token");
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Auth boot check error:", e);
      } finally {
        setBooting(false);
      }
    };
    checkAuth();

    // Set up interceptor to handle 401 Unauthorized globally
    const interceptor = API.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401) {
          try {
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("user");
          } catch (e) {
            console.error("Failed to clear auth storage on 401:", e);
          }
          setUser(null);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      API.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (username, password) => {
    try {
      const response = await API.post("/auth/login", { username, password });
      const data = response.data;
      await AsyncStorage.setItem("token", data.token);
      const userProfile = {
        _id: data._id,
        name: data.name,
        username: data.username,
        role: data.role,
        center: data.center,
        agentPercentage: data.agentPercentage,
        balance: data.balance
      };
      await AsyncStorage.setItem("user", JSON.stringify(userProfile));
      setUser(userProfile);
      return { success: true };
    } catch (error) {
      console.warn("Login API Error Details:", error.message, error.response?.data || error);
      const msg = error.response?.data?.message || `Login failed (${error.message})`;
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      setUser(null);
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const refreshProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await API.get("/auth/profile");
      await AsyncStorage.setItem("user", JSON.stringify(res.data));
      setUser(res.data);
    } catch (e) {
      if (e.response?.status !== 401) {
        console.error("Profile refresh error:", e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, booting, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
