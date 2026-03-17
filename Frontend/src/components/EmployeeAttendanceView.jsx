import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const BarChart = ({ title, data }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 space-y-3">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="flex items-end gap-3 h-32">
        {data.map((d) => (
          <div key={d.label} className="flex flex-col items-center gap-1">
            <div
              className="w-8 rounded-md bg-gradient-to-t from-indigo-500 to-cyan-400"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: 6 }}
              title={`${d.label}: ${d.value}`}
            />
            <div className="text-[11px] text-slate-400">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EmployeeAttendanceView = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const from = new Date(new Date().getFullYear(), 0, 1).toISOString();
        const to = new Date().toISOString();
        const res = await axios.get(`${API_BASE}/api/attendance`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params: { from, to },
        });
        const mine = (res.data?.records || []).filter((r) => r.user?._id === user?._id);
        setRecords(mine);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to load attendance");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?._id]);

  const act = async (action) => {
    setActionLoading(true);
    setActionMsg("");
    setError("");
    try {
      const token = localStorage.getItem("token");
      const today = new Date().toISOString().slice(0, 10);
      await axios.post(
        `${API_BASE}/api/attendance`,
        { userId: user?._id, date: today, action },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setActionMsg(action === "checkin" ? "Checked in" : "Checked out");
      // reload fresh data
      const from = new Date(new Date().getFullYear(), 0, 1).toISOString();
      const to = new Date().toISOString();
      const res = await axios.get(`${API_BASE}/api/attendance`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { from, to },
      });
      const mine = (res.data?.records || []).filter((r) => r.user?._id === user?._id);
      setRecords(mine);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to update attendance");
    } finally {
      setActionLoading(false);
    }
  };

  const last7Data = useMemo(() => {
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayLabel = labels[d.getDay()];
      const present = records.some(
        (r) =>
          r.status === "Present" &&
          new Date(r.date).toDateString() === d.toDateString()
      )
        ? 1
        : 0;
      arr.push({ label: dayLabel, value: present });
    }
    return arr;
  }, [records]);

  const lastMonthData = useMemo(() => {
    const weeks = [0, 0, 0, 0];
    records.forEach((r) => {
      const d = new Date(r.date);
      const now = new Date();
      const prevMonth = now.getMonth() - 1;
      if (d.getMonth() === prevMonth) {
        const weekIndex = Math.min(3, Math.floor((d.getDate() - 1) / 7));
        if (r.status === "Present") weeks[weekIndex] += 1;
      }
    });
    return weeks.map((v, i) => ({ label: `W${i + 1}`, value: v }));
  }, [records]);

  const yearData = useMemo(() => {
    const months = Array(12).fill(0);
    records.forEach((r) => {
      const d = new Date(r.date);
      const now = new Date();
      if (d.getFullYear() === now.getFullYear() && r.status === "Present") {
        months[d.getMonth()] += 1;
      }
    });
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((v, i) => ({ label: labels[i], value: v }));
  }, [records]);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">Attendance</h2>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => act("checkin")}
          disabled={actionLoading}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-60"
        >
          {actionLoading ? "Working..." : "Check In"}
        </button>
        <button
          type="button"
          onClick={() => act("checkout")}
          disabled={actionLoading}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-60"
        >
          {actionLoading ? "Working..." : "Check Out"}
        </button>
        {actionMsg && <span className="text-sm text-emerald-300">{actionMsg}</span>}
      </div>
      {loading && <div className="text-slate-300 text-sm">Loading attendance...</div>}
      {error && <div className="text-rose-400 text-sm">{error}</div>}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <BarChart title="Last 7 Days" data={last7Data} />
        <BarChart title="Last Month (weeks)" data={lastMonthData} />
        <BarChart title="Current Year (months)" data={yearData} />
      </div>
    </div>
  );
};

export default EmployeeAttendanceView;
