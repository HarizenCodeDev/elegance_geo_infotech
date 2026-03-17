import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AuthContext = createContext(null);

// Provides auth state and helpers across the app
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // hydrate user from stored token on page load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || user) return;
    axios
      .get(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUser(res.data?.user))
      .catch(() => {
        localStorage.removeItem("token");
      });
  }, [user]);

  const login = (userData) => setUser(userData);

  const updateAvatar = (avatarUrl) =>
    setUser((prev) => (prev ? { ...prev, avatar: avatarUrl } : prev));

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export default AuthProvider;
