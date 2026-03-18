
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiBell, FiCheck } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.notifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE}/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FiBell />
        Notifications
      </h2>
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-slate-400">No new notifications.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-lg flex items-start gap-3 transition ${
                n.read ? "bg-slate-800/50" : "bg-slate-700"
              }`}
            >
              <div className="flex-1">
                <h3 className="font-semibold text-white">{n.title}</h3>
                <p className="text-sm text-slate-300">{n.body}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="p-2 rounded-full hover:bg-slate-600"
                  title="Mark as read"
                >
                  <FiCheck />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;