import React, { createContext, useContext, useEffect } from "react";
import socket from "../utils/socket";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      socket.connect();
      console.log("Socket.io connecting for user:", user.name);
    } else {
      if (socket.connected) {
        socket.disconnect();
        console.log("Socket.io disconnected");
      }
    }

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
