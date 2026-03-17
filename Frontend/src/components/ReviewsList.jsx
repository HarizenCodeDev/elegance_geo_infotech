import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ReviewsList = ({ onAddNew, title = "Performance Reviews", filterRevieweeId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams();
        if (filterRevieweeId) params.append("revieweeId", filterRevieweeId);
        const res = await axios.get(`${API_BASE}/api/reviews?${params}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setReviews(res.data?.reviews || []);
      } catch (err) {
        const msg = err.response?.data?.error || err.message || "Failed to load reviews";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [filterRevieweeId]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return reviews.filter((r) =>
      r.reviewee.name?.toLowerCase().includes(term) ||
      r.reviewer.name?.toLowerCase().includes(term) ||
      r.feedback?.toLowerCase().includes(term)
    );
  }, [reviews, search]);

  if (loading) return <div className="text-slate-300 text-sm">Loading reviews...</div>;
  if (error) return <div className="text-rose-400 text-sm">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {onAddNew && (
          <button
            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            onClick={onAddNew}
          >
            Add Review
          </button>
        )}
      </div>
      <input
        placeholder="Search reviews by name or feedback"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-white"
      />
      <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/60">
        <table className="min-w-full text-sm text-slate-200">
          <thead className="bg-slate-800 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left">Reviewed</th>
              <th className="px-3 py-2 text-left">Reviewer</th>
              <th className="px-3 py-2 text-left">Rating</th>
              <th className="px-3 py-2 text-left">Review Date</th>
              <th className="px-3 py-2 text-left">Feedback</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                  No reviews found
                </td>
              </tr>
            )}
{filtered.map((review) => (
              <tr key={review.id} className="border-t border-slate-800 hover:bg-slate-700/50">
                <td className="px-3 py-3">
                  <div className="font-medium text-white">{review.reviewee.name}</div>
                  <div className="text-xs text-slate-400">{review.reviewee.department}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="capitalize text-slate-200">{review.reviewer.name}</div>
                  <div className="text-xs text-slate-400 capitalize">{review.reviewer.role}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="inline-flex items-center gap-1 text-lg font-bold">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-amber-400 ${i < review.rating ? 'fill-current' : 'text-slate-600'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-slate-400">({review.rating}/5)</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-slate-200">
                  {new Date(review.reviewDate).toLocaleDateString()}
                </td>
                <td className="px-3 py-3 max-w-md">
                  <div className="text-slate-200 line-clamp-2">{review.feedback || "No feedback"}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReviewsList;
