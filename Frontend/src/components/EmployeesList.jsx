import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const TableSection = ({ title, rows, showPosition, onView, onEdit }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
    </div>
    <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/60">
      <table className="min-w-full text-sm text-slate-200">
        <thead className="bg-slate-800 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-3 py-2 text-left">S No</th>
            <th className="px-3 py-2 text-left">Profile Pic</th>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-left">DOB</th>
            <th className="px-3 py-2 text-left">Department</th>
            {showPosition && <th className="px-3 py-2 text-left">Position</th>}
            <th className="px-3 py-2 text-left">Access</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={showPosition ? 7 : 6} className="px-3 py-4 text-center text-slate-400">
                No employees found
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
              <td className="px-3 py-2 whitespace-nowrap">
                {emp.dob ? new Date(emp.dob).toLocaleDateString() : "-"}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{emp.department || "-"}</td>
              {showPosition && <td className="px-3 py-2 whitespace-nowrap capitalize">{emp.role || "-"}</td>}
              <td className="px-3 py-2 space-x-2 whitespace-nowrap">
                <button
                  className="text-indigo-300 hover:text-white text-xs"
                  onClick={() => onView?.(emp)}
                >
                  View
                </button>
                <button
                  className="text-sky-300 hover:text-white text-xs"
                  onClick={() => onEdit?.(emp)}
                >
                  Edit
                </button>
                <button className="text-emerald-300 hover:text-white text-xs">Salary</button>
                <button className="text-amber-300 hover:text-white text-xs">Leave</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const EmployeesList = ({ onAddNew, onView, onEdit }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/employees`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setEmployees(res.data?.users || []);
      } catch (err) {
        const msg = err.response?.data?.error || err.message || "Failed to load employees";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.employeeId?.toLowerCase().includes(term) ||
        e.name?.toLowerCase().includes(term)
    );
  }, [employees, search]);

  const hrTl = filtered.filter((e) => ["hr", "teamlead"].includes(e.role));
  const others = filtered.filter((e) => !["hr", "teamlead"].includes(e.role));

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">Manage Employees</h2>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          placeholder="Search by Employee ID or Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-white w-full sm:w-72"
        />
        <div className="sm:ml-auto">
          <button
            type="button"
            onClick={() => onAddNew?.()}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Add New Employee
          </button>
        </div>
      </div>

      {loading && <div className="text-slate-300 text-sm">Loading employees...</div>}
      {error && <div className="text-rose-400 text-sm">{error}</div>}

      {!loading && (
        <div className="space-y-8">
          <TableSection title="Manage Employees" rows={others} showPosition={false} onView={onView} onEdit={onEdit} />
          <TableSection title="HR and TL" rows={hrTl} showPosition onView={onView} onEdit={onEdit} />
        </div>
      )}
    </div>
  );
};

export default EmployeesList;
