import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AnnouncementsList = ({ title = "Announcement List" }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/announcements`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setRows(res.data?.announcements || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      {loading && <div className="text-slate-300 text-sm">Loading announcements...</div>}
      {error && <div className="text-rose-400 text-sm">{error}</div>}
      <div className="space-y-3">
        {rows.length === 0 && !loading && <div className="text-slate-400 text-sm text-center">No announcements.</div>}
        {rows.map((a) => (
          <div key={a.id || a._id} className="rounded-lg border border-slate-700 bg-slate-800/70 p-4">
            <div className="flex justify-between items-start gap-2 text-sm text-slate-300">
              <div>
                <div className="font-semibold text-white">{a.title}</div>
                <div className="text-xs text-slate-400">
                  {new Date(a.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </div>
              </div>
              <div className="text-right text-xs text-emerald-400">
                {a.createdBy?.name || "Admin"} {a.createdBy?.role ? `• ${a.createdBy.role}` : ""}
              </div>
            </div>
            <p className="text-sm text-slate-100 mt-2 whitespace-pre-line">{a.message}</p>
            {(a.audienceRoles?.length || a.audienceDepartments?.length) && (
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                {a.audienceRoles?.map((r) => (
                  <span key={r} className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">
                    {r}
                  </span>
                ))}
                {a.audienceDepartments?.map((d) => (
                  <span key={d} className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsList;
