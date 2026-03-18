import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { useSocket } from '../hooks/useSocket';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const NotificationsList = ({ onClose }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/notifications`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setNotifications(res.data.notifications);
      } catch (err) {
        console.error('Fetch notifications error', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    socket?.on('notification', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    return () => {
      socket?.off('notification');
    };
  }, [user, socket]);

  const markRead = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications((prev) => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Mark read error', err);
    }
  };

  if (loading) return <div className="p-4 text-sm">Loading...</div>;

  return (
    <div className="w-80 max-h-96 overflow-y-auto bg-slate-900 border-l border-slate-700">
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur p-4 border-b border-slate-700">
        <h3 className="font-semibold text-white">Notifications</h3>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white">×</button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-sm">No notifications</div>
      ) : (
        notifications.map((n) => (
          <div key={n.id} className={`p-4 border-b border-slate-800 hover:bg-slate-800 ${n.read ? 'opacity-60' : ''}`}>
            <div className="text-sm font-medium text-white">{n.title}</div>
            <div className="text-xs text-slate-300 mt-1">{n.body}</div>
            <div className="text-xs text-slate-500 mt-2">{new Date(n.createdAt).toLocaleString()}</div>
            {!n.read && (
              <button
                onClick={() => markRead(n.id)}
                className="mt-2 text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-500"
              >
                Mark read
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationsList;

