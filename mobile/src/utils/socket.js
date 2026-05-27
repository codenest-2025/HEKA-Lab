import { io } from "socket.io-client";

const rawBaseURL = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "https://heka-lab.onrender.com/";
const socketURL = rawBaseURL.replace(/\/$/, "").replace(/\/api$/, "");

const socket = io(socketURL, {
  autoConnect: false,
  transports: ["websocket"] // ensure websocket connections
});

export default socket;
