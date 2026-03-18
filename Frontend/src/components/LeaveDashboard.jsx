import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const LeaveDashboard = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/leaves`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaves(res.data.leaves);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaves = leaves.filter((leave) => {
    if (statusFilter === "All") return true;
    return leave.status === statusFilter;
  });

  if (loading) return <div className="text-white text-center">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Leave Dashboard</h2>

      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-sm"
        >
          <option>All</option>
          <option>Pending</option>
          <option>Level1Approved</option>
          <option>Level1Rejected</option>
          <option>Level2Approved</option>
          <option>Level2Rejected</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/60">
        <table className="min-w-full text-sm text-slate-200">
          <thead className="bg-slate-800 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left">Employee</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">From</th>
              <th className="px-3 py-2 text-left">To</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.map((leave) => (
              <tr key={leave.id} className="border-t border-slate-800">
                <td className="px-3 py-2">{leave.user.name}</td>
                <td className="px-3 py-2">{leave.type}</td>
                <td className="px-3 py-2">{new Date(leave.from).toLocaleDateString()}</td>
                <td className="px-3 py-2">{new Date(leave.to).toLocaleDateString()}</td>
                <td className="px-3 py-2">{leave.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveDashboard;