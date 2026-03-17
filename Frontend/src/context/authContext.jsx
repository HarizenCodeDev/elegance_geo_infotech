import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

// Provides auth state and helpers across the app
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

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

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export default AuthProvider;
