import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const EditEmployeeForm = ({ employee, onDone }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    employeeId: "",
    dob: "",
    gender: "",
    maritalStatus: "",
    department: "",
    salary: "",
    role: "developer",
    password: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || "",
        email: employee.email || "",
        employeeId: employee.employeeId || "",
        dob: employee.dob ? employee.dob.slice(0, 10) : "",
        gender: employee.gender || "",
        maritalStatus: employee.maritalStatus || "",
        department: employee.department || "",
        salary: employee.salary || "",
        role: employee.role || "developer",
        password: "",
      });
    }
  }, [employee]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) fd.append(k, v);
      });
      if (file) fd.append("profileImage", file);
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE}/api/employees/${employee._id}`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      setSuccess("Employee updated successfully.");
      if (onDone) onDone();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to update employee";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Edit Employee</h2>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name" value={form.name} onChange={(v) => update("name", v)} required />
          <Input label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} required />
          <Input label="Employee ID" value={form.employeeId} onChange={(v) => update("employeeId", v)} />
          <Input label="Date of Birth" type="date" value={form.dob} onChange={(v) => update("dob", v)} />
          <Select
            label="Gender"
            value={form.gender}
            onChange={(v) => update("gender", v)}
            options={["", "male", "female", "other"]}
          />
          <Select
            label="Marital Status"
            value={form.maritalStatus}
            onChange={(v) => update("maritalStatus", v)}
            options={["", "single", "married"]}
          />
          <Input label="Department" value={form.department} onChange={(v) => update("department", v)} />
          <Input label="Salary" type="number" value={form.salary} onChange={(v) => update("salary", v)} />
          <Input label="Password (leave blank to keep)" type="password" value={form.password} onChange={(v) => update("password", v)} />
          <Select
            label="Role"
            value={form.role}
            onChange={(v) => update("role", v)}
            options={["developer", "teamlead", "manager", "hr", "admin", "root"]}
          />
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Upload Profile Image</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-slate-200" />
          </div>
        </div>

        {error && <div className="text-sm text-rose-400">{error}</div>}
        {success && <div className="text-sm text-emerald-400">{success}</div>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

const Input = ({ label, type = "text", value, onChange, required }) => (
  <div className="space-y-2">
    <label className="text-sm text-slate-200">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white"
    />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div className="space-y-2">
    <label className="text-sm text-slate-200">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt || "Select"}
        </option>
      ))}
    </select>
  </div>
);

export default EditEmployeeForm;
