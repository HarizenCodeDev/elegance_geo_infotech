import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./authContext";
import { API_BASE } from "../utils/api"; // or hardcode

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef();

  useEffect(() => {
    if (user && localStorage.getItem("token")) {
      const newSocket = io(API_BASE, {
        auth: { token: localStorage.getItem("token") }
      });
      socketRef.current = newSocket;

      newSocket.on("connect", () => {
        console.log("Socket connected");
        setSocket(newSocket);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
        setSocket(null);
      });

      newSocket.on("connect_error", (err) => {
        console.log("Socket connection error", err.message);
        if (err.message === "Invalid token") logout();
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx.socket;
};

