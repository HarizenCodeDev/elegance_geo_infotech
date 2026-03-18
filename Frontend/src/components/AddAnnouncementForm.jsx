import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const roleOptions = [
  { value: "all", label: "All" },
  { value: "developer", label: "Developers" },
  { value: "teamlead", label: "Team Leads" },
  { value: "manager", label: "Managers" },
  { value: "admin", label: "Admins" },
  { value: "root", label: "Root" },
  { value: "hr", label: "HR" },
];

const AddAnnouncementForm = ({ onCreated }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audienceRoles, setAudienceRoles] = useState(["all"]);
  const [audienceDepartments, setAudienceDepartments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const toggleRole = (value) => {
    if (value === "all") {
      setAudienceRoles(["all"]);
      return;
    }
    setAudienceRoles((prev) => {
      const next = prev.includes(value) ? prev.filter((r) => r !== value) : [...prev.filter((r) => r !== "all"), value];
      return next.length ? next : ["all"];
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE}/api/announcements`,
        {
          title,
          message,
          audienceRoles,
          audienceDepartments: audienceDepartments
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean),
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setSuccess("Announcement posted");
      setTitle("");
      setMessage("");
      setAudienceRoles(["all"]);
      setAudienceDepartments("");
      if (onCreated) onCreated(res.data?.announcement);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to post announcement");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  const allowed = ['admin', 'manager', 'hr'];
  if (!allowed.includes(user.role)) {
    return (
      <div className="max-w-3xl mx-auto bg-slate-800/60 border border-slate-700 rounded-xl p-6 text-slate-100">
        <h2 className="text-xl font-semibold mb-2">Add Announcement</h2>
        <div className="text-sm text-slate-300">You do not have permission to post announcements.</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-slate-800/60 border border-slate-700 rounded-xl p-6 text-slate-100">
      <h2 className="text-xl font-semibold mb-4">Add Announcement</h2>
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="block text-sm mb-1 text-slate-300">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-slate-300">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white min-h-[120px]"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Audience Roles</label>
            <span className="text-[11px] text-slate-400">Select “All” or specific roles</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {roleOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleRole(opt.value)}
                className={`px-3 py-1 rounded-full text-sm border ${
                  audienceRoles.includes(opt.value)
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "bg-slate-900 border-slate-700 text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1 text-slate-300">Departments (comma separated, optional)</label>
          <input
            value={audienceDepartments}
            onChange={(e) => setAudienceDepartments(e.target.value)}
            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white"
            placeholder="HR, Development, Business Development"
          />
        </div>
        {error && <div className="text-sm text-rose-400">{error}</div>}
        {success && <div className="text-sm text-emerald-400">{success}</div>}
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-60"
        >
          {submitting ? "Posting..." : "Post Announcement"}
        </button>
      </form>
    </div>
  );
};

export default AddAnnouncementForm;
