import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const EmployeeAnnouncements = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // if no endpoint exists, keep empty; placeholder for future API
        const token = localStorage.getItem("token");
        const res = await axios
          .get(`${API_BASE}/api/announcements`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
          .catch(() => ({ data: { announcements: [] } }));
        setRows(res.data?.announcements || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">Announcements</h2>
      </div>
      {loading && <div className="text-slate-300 text-sm">Loading announcements...</div>}
      {error && <div className="text-rose-400 text-sm">{error}</div>}
      <div className="space-y-3">
        {rows.length === 0 && !loading && <div className="text-slate-400 text-sm text-center">No announcements.</div>}
        {rows.map((a) => (
          <div key={a.id || a._id} className="rounded-lg border border-slate-700 bg-slate-800/70 p-4">
            <div className="flex justify-between text-sm text-slate-300">
              <span className="font-semibold text-white">{a.title}</span>
              <span className="text-xs text-slate-400">From: {a.from || a.author || "Admin"}</span>
            </div>
            <p className="text-sm text-slate-200 mt-1">{a.body || a.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeAnnouncements;
