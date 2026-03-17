import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const LeaveApproval = ({ onBack }) => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/leaves`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter pending leaves for approval
      const pending = res.data.leaves.filter(l => l.status === 'Pending');
      setLeaves(pending);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  const approveLevel1 = async (leaveId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE}/api/leaves/${leaveId}/approve-level1`, 
        { comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadLeaves(); // Refresh
      setSelectedLeave(null);
      setComment("");
    } catch (err) {
      alert(err.response?.data?.error || "Approval failed");
    }
  };

  const rejectLevel1 = async (leaveId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE}/api/leaves/${leaveId}/reject-level1`, 
        { comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadLeaves();
      setSelectedLeave(null);
      setComment("");
    } catch (err) {
      alert(err.response?.data?.error || "Rejection failed");
    }
  };

  const approveLevel2 = async (leaveId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE}/api/leaves/${leaveId}/approve-level2`, 
        { comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadLeaves();
      setSelectedLeave(null);
      setComment("");
    } catch (err) {
      alert(err.response?.data?.error || "Approval failed");
    }
  };

  if (loading) return <div className="text-white text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-slate-400 hover:text-white">&larr; Back</button>
        <h2 className="text-2xl font-bold text-white">Leave Approvals</h2>
      </div>

      {leaves.length === 0 ? (
        <div className="text-center text-slate-400 py-12">
          No pending leave requests
        </div>
      ) : (
        <div className="grid gap-4">
          {leaves.map((leave) => (
            <div key={leave.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-indigo-500 transition">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-semibold text-white">{leave.user.name}</div>
                    <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs">
                      {leave.type}
                    </span>
                  </div>
                  <div className="text-slate-300 mb-2">
                    {leave.from?.toLocaleDateString()} - {leave.to?.toLocaleDateString()} ({Math.ceil((new Date(leave.to) - new Date(leave.from)) / 86400000) + 1} days)
                  </div>
                  <div className="text-slate-400 text-sm">{leave.description}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedLeave(leave.id);
                      setComment("");
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm"
                  >
                    Approve L1
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLeave(leave.id);
                      setComment("");
                    }}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-500 text-sm"
                  >
                    Reject L1
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedLeave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && setSelectedLeave(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Leave Action</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional comment/reason..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => approveLevel1(selectedLeave)}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-500"
              >
                Approve Level 1
              </button>
              <button
                onClick={() => rejectLevel1(selectedLeave)}
                className="flex-1 bg-rose-600 text-white py-3 rounded-lg font-semibold hover:bg-rose-500"
              >
                Reject Level 1
              </button>
            </div>
{localStorage.getItem("token") && (
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => approveLevel2(selectedLeave)}
                  className="flex-1 bg-sky-600 text-white py-2 rounded-lg font-semibold hover:bg-sky-500 text-sm"
                >
                  Final Approve (Root)
                </button>
              </div>
            )}
            <button
              onClick={() => setSelectedLeave(null)}
              className="w-full mt-4 text-slate-400 hover:text-white text-sm underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApproval;

</xai:function_call} 

**Phase 7 Progress: Backend approval endpoints complete (Level 1/2). Frontend LeaveApproval.jsx created.**

Next: Integrate into AdminDashboard + validation. Backend restart needed (`Ctrl+C` terminal + rerun). OK? 

<parameter name="result">Phase 7 Backend complete. Frontend approval UI ready. Test workflow.
