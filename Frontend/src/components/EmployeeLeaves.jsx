import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const statusOptions = ["All", "Pending", "Approved", "Rejected"];

const EmployeeLeaves = () => {
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "", from: "", to: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/leaves`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const filtered =
        res.data?.leaves
          ?.filter((l) => l.user?._id === user?._id)
          .map((l) => ({
            id: l._id,
            empId: l.user?.employeeId || "NA",
            name: l.user?.name || "Unknown",
            type: l.type,
            dept: l.user?.department || "-",
            days: l.from && l.to ? Math.max(1, (new Date(l.to) - new Date(l.from)) / 86400000 + 1) : 1,
            status: l.status,
          })) || [];
      setRows(filtered);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((l) => {
      const matchStatus = statusFilter === "All" ? true : l.status === statusFilter;
      const matchSearch =
        l.empId.toLowerCase().includes(search.toLowerCase()) ||
        l.name.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [statusFilter, search, rows]);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">Leave Request</h2>
      </div>
      {loading && <div className="text-slate-300 text-sm">Loading leaves...</div>}
      {error && <div className="text-rose-400 text-sm">{error}</div>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          placeholder="Search by Employee ID or Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-white w-full sm:w-72"
        />
        <div className="flex gap-2">
          {statusOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                statusFilter === s
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-200 border border-slate-700"
              }`}
            >
              {s}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg px-3 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500"
          >
            Apply
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 space-y-3">
          <div className="text-sm font-semibold text-white">New Leave Request</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Leave Type</label>
              <input
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-sm"
                placeholder="e.g. Sick, Casual"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">From Date</label>
              <input
                type="date"
                value={form.from}
                onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">To Date</label>
              <input
                type="date"
                value={form.to}
                onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-sm"
              placeholder="Reason for leave..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold bg-slate-700 text-white hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const token = localStorage.getItem("token");
                  await axios.post(
                    `${API_BASE}/api/leaves`,
                    { type: form.type, from: form.from, to: form.to, description: form.description },
                    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                  );
                  setShowForm(false);
                  setForm({ type: "", from: "", to: "", description: "" });
                  setStatusFilter("All");
                  await load();
                } catch (err) {
                  setError(err.response?.data?.error || err.message || "Failed to submit leave");
                }
              }}
              className="rounded-lg px-3 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500"
            >
              Request Leave
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/60">
        <table className="min-w-full text-sm text-slate-200">
          <thead className="bg-slate-800 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left">S No</th>
              <th className="px-3 py-2 text-left">Emp ID</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Leave Type</th>
              <th className="px-3 py-2 text-left">Department</th>
              <th className="px-3 py-2 text-left">Days</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-slate-400">
                  No requests found
                </td>
              </tr>
            )}
            {filtered.map((l, idx) => (
              <tr key={l.id} className="border-t border-slate-800">
                <td className="px-3 py-2">{idx + 1}</td>
                <td className="px-3 py-2">{l.empId}</td>
                <td className="px-3 py-2 whitespace-nowrap">{l.name}</td>
                <td className="px-3 py-2">{l.type}</td>
                <td className="px-3 py-2">{l.dept}</td>
                <td className="px-3 py-2">{l.days}</td>
                <td className="px-3 py-2">{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeLeaves;
