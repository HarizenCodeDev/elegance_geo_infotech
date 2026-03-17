import React, { useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AddEmployeeForm = () => {
  const emptyForm = {
    name: "",
    email: "",
    employeeId: "",
    dob: "",
    gender: "",
    maritalStatus: "",
    department: "",
    salary: "",
    password: "",
    role: "developer",
  };
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("profileImage", file);
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE}/api/employees`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      setSuccess("Developer added successfully.");
      setForm(emptyForm);
      setFile(null);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to add employee";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Add New Developer</h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Name</label>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Email</label>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white" required />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-200">Employee ID</label>
            <input value={form.employeeId} onChange={(e) => update("employeeId", e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Date of Birth</label>
            <input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white" />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-200">Gender</label>
            <select value={form.gender} onChange={(e) => update("gender", e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Marital Status</label>
            <select value={form.maritalStatus} onChange={(e) => update("maritalStatus", e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white">
              <option value="">Select</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-200">Department</label>
            <input value={form.department} onChange={(e) => update("department", e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white" />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-200">Salary</label>
            <input type="number" value={form.salary} onChange={(e) => update("salary", e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Password</label>
            <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white" required />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-200">Role</label>
            <select value={form.role} onChange={(e) => update("role", e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white" required>
              <option value="developer">Developer</option>
              <option value="teamlead">Team Lead</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
              <option value="admin">Admin</option>
              <option value="root">Root</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Upload Profile Image</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-slate-200" />
          </div>
        </div>

        {error && <div className="text-sm text-rose-400">{error}</div>}
        {success && <div className="text-sm text-emerald-400">{success}</div>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Employee"}
        </button>
      </form>
    </div>
  );
};

export default AddEmployeeForm;
