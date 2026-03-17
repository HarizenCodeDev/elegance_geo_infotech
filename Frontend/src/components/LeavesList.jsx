import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const LeavesList = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaves = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/leaves`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const formatted = res.data?.leaves?.map((l) => ({
          id: l.id,
          empId: l.user?.employeeId || "NA",
          name: l.user?.name || "NA",
          type: l.type || "General",
          from: l.from ? new Date(l.from).toLocaleDateString() : "-",
          to: l.to ? new Date(l.to).toLocaleDateString() : "-",
          status: l.status || "Pending",
          days: l.to && l.from ? Math.ceil((new Date(l.to) - new Date(l.from)) / (1000 * 60 * 60 * 24)) + 1 : "-",
        })) || [];
        setRows(formatted);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to load leaves");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">Leave Requests</h2>
      </div>
      {loading && <div className="text-slate-300 text-sm">Loading...</div>}
      {error && <div className="text-rose-400 text-sm">{error}</div>}
      <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/60">
        <table className="min-w-full text-sm text-slate-200">
          <thead className="bg-slate-800 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-2 text-left">S No</th>
              <th className="px-4 py-2 text-left">Employee ID</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">From</th>
              <th className="px-4 py-2 text-left">To</th>
              <th className="px-4 py-2 text-left">Days</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                <td className="px-4 py-3">{idx + 1}</td>
                <td className="px-4 py-3">{row.empId}</td>
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3">{row.type}</td>
                <td className="px-4 py-3">{row.from}</td>
                <td className="px-4 py-3">{row.to}</td>
                <td className="px-4 py-3">{row.days}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    row.status === "Approved" ? "bg-emerald-500/20 text-emerald-300" :
                    row.status === "Rejected" ? "bg-rose-500/20 text-rose-300" :
                    "bg-amber-500/20 text-amber-300"
                  }`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeavesList;
