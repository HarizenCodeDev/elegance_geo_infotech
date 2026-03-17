import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AddReviewForm = ({ onDone, revieweeId: prefilledRevieweeId }) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    revieweeId: prefilledRevieweeId || "",
    rating: 3,
    feedback: "",
    reviewDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(res.data.users || []);
    };
    fetchEmployees();
  }, []);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.revieweeId || !form.rating) {
      setError("Reviewee and rating required");
      return;
    }
    if (form.revieweeId === user.id) {
      setError("Cannot review yourself");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE}/api/reviews`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Review submitted successfully!");
      if (onDone) onDone();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to submit review";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-800/60 border border-slate-700 rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-semibold mb-6 text-white text-center">Add Performance Review</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1.5">Review Employee</label>
          <select
            value={form.revieweeId}
            onChange={(e) => update("revieweeId", e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white"
            required
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.department || 'N/A'})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1.5">Rating (1-5)</label>
          <select
            value={form.rating}
            onChange={(e) => update("rating", parseInt(e.target.value))}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white"
            required
          >
            {[1,2,3,4,5].map((r) => (
              <option key={r} value={r}>{r} Star{r === 1 ? '' : 's'}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1.5">Review Date</label>
          <input
            type="date"
            value={form.reviewDate}
            onChange={(e) => update("reviewDate", e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1.5">Feedback (Optional)</label>
          <textarea
            value={form.feedback}
            onChange={(e) => update("feedback", e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white resize-vertical"
            placeholder="Enter feedback about performance..."
          />
        </div>
        {error && <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500 text-rose-200 text-sm">{error}</div>}
        {success && <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500 text-emerald-200 text-sm">{success}</div>}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50 transition"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
          {onDone && (
            <button
              type="button"
              onClick={onDone}
              className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddReviewForm;
