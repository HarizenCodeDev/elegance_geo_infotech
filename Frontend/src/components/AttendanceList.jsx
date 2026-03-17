import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AttendanceList = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { user } = useAuth();
  const canUpdate = ["admin", "manager", "root"].includes(user?.role);

  const loadData = async (selectedDate) => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const [usersRes, attRes] = await Promise.all([
          axios.get(`${API_BASE}/api/employees`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          axios.get(`${API_BASE}/api/attendance`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            params: { date: selectedDate },
          }),
        ]);

        const statusByUser = {};
        (attRes.data?.records || []).forEach((r) => {
          statusByUser[r.user?._id] = r.status;
        });

        const withStatus = (usersRes.data?.users || []).map((u) => ({
          ...u,
          attendanceStatus: statusByUser[u._id] || "Pending",
        }));
        setRows(withStatus);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to load developers");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  };

  useEffect(() => {
    loadData(date);
  }, [date]);

  const setStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE}/api/attendance`,
        { userId: id, status, date },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setRows((prev) => prev.map((r) => (r._id === id ? { ...r, attendanceStatus: status } : r)));
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to update attendance");
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">Add Attendance</h2>
      </div>
      <div className="flex justify-end">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-white"
        />
      </div>
      {loading && <div className="text-slate-300 text-sm">Loading developers...</div>}
      {error && <div className="text-rose-400 text-sm">{error}</div>}
      <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/60">
        <table className="min-w-full text-sm text-slate-200">
          <thead className="bg-slate-800 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left">S No</th>
              <th className="px-3 py-2 text-left">Profile Pic</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Department</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-slate-400">
                  No developers found
                </td>
              </tr>
            )}
            {rows.map((emp, idx) => (
              <tr key={emp._id || idx} className="border-t border-slate-800">
                <td className="px-3 py-2">{idx + 1}</td>
                <td className="px-3 py-2">
                  <div className="h-10 w-10 rounded-full bg-slate-700 overflow-hidden">
                    {emp.profileImage ? (
                      <img src={emp.profileImage} alt={emp.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-white">
                        {emp.name?.slice(0, 2)?.toUpperCase() || "NA"}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{emp.name}</td>
                <td className="px-3 py-2 whitespace-nowrap">{emp.department || "-"}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {canUpdate ? (
                    <div className="flex items-center gap-2">
                      <button
                        className={`text-xs ${emp.attendanceStatus === "Present" ? "text-emerald-300" : "text-emerald-400 hover:text-white"}`}
                        onClick={() => setStatus(emp._id, "Present")}
                      >
                        Present
                      </button>
                      <button
                        className={`text-xs ${emp.attendanceStatus === "Absent" ? "text-rose-300" : "text-rose-400 hover:text-white"}`}
                        onClick={() => setStatus(emp._id, "Absent")}
                      >
                        Absent
                      </button>
                      <span className="text-xs text-slate-300">({emp.attendanceStatus || "Pending"})</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300">{emp.attendanceStatus || "Pending"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceList;
