import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const PasswordResetRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/password-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data.requests);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !newPassword) return;
    setResetting(true);
    setResetMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE}/api/auth/root-reset`,
        { email: selectedRequest.email, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResetMessage(res.data.message || "Password has been reset.");
      setNewPassword("");
      setTimeout(() => {
        setSelectedRequest(null);
        loadRequests();
      }, 2000);
    } catch (err) {
      setResetMessage(err.response?.data?.error || "Failed to reset password.");
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <div className="text-white text-center">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Password Reset Requests</h2>
      {requests.length === 0 ? (
        <div className="text-center text-slate-400 py-12">
          No pending password reset requests.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/60">
          <table className="min-w-full text-sm text-slate-200">
            <thead className="bg-slate-800 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Requested At</th>
                <th className="px-3 py-2 text-left">Expires At</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-t border-slate-800">
                  <td className="px-3 py-2">{req.email}</td>
                  <td className="px-3 py-2">{new Date(req.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{new Date(req.expiresAt).toLocaleString()}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-xs"
                    >
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && setSelectedRequest(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Reset Password for {selectedRequest.email}</h3>
            <form onSubmit={handleResetPassword}>
              <p className="text-sm text-slate-400 mb-4">
                Enter a new temporary password for the user. They will be required to change it on their next login.
              </p>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new temporary password"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white mb-4"
                required
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={resetting}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed"
                >
                  {resetting ? "Resetting..." : "Confirm Reset"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 bg-slate-700 text-white py-3 rounded-lg font-semibold hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
              {resetMessage && (
                <p className="text-sm text-center mt-4 text-emerald-400">{resetMessage}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordResetRequests;