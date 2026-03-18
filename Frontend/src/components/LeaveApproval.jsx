import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const LeaveApproval = ({ onBack }) => {
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
      const pending = res.data.leaves.filter(l => l.status === 'Pending');
      setLeaves(pending);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  const approveLeave = async (leaveId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE}/api/leaves/${leaveId}/approve`, { comment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadLeaves();
      setSelectedLeave(null);
      setComment("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to approve leave");
    }
  };

  const rejectLeave = async (leaveId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE}/api/leaves/${leaveId}/reject`, { comment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadLeaves();
      setSelectedLeave(null);
      setComment("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reject leave");
    }
  };

  if (loading) return <div className="text-white text-center">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  if (selectedLeave) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Leave Request Details</h3>
          <button
            onClick={() => setSelectedLeave(null)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">Employee</label>
            <p className="text-white">{selectedLeave.user.name}</p>
          </div>
          
          <div>
            <label className="block text-slate-400 text-sm mb-1">Leave Type</label>
            <p className="text-white">{selectedLeave.type}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1">From Date</label>
              <p className="text-white">{new Date(selectedLeave.from).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">To Date</label>
              <p className="text-white">{new Date(selectedLeave.to).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-slate-400 text-sm mb-1">Description</label>
            <p className="text-white">{selectedLeave.description}</p>
          </div>
          
          <div>
            <label className="block text-slate-400 text-sm mb-1">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              rows="3"
              placeholder="Optional comment..."
            />
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => approveLeave(selectedLeave.id)}
              className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-500"
            >
              Approve
            </button>
            <button
              onClick={() => rejectLeave(selectedLeave.id)}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-500"
            >
              Reject
            </button>
          </div>
          
          <button
            onClick={() => setSelectedLeave(null)}
            className="w-full mt-4 text-slate-400 hover:text-white text-sm underline"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Leave Approval</h3>
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      {leaves.length === 0 ? (
        <div className="text-slate-400 text-center py-8">
          No pending leave requests
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => (
            <div
              key={leave.id}
              className="border border-slate-700 rounded-lg p-4 hover:bg-slate-800/40 cursor-pointer"
              onClick={() => setSelectedLeave(leave)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-white font-semibold">{leave.user.name}</h4>
                  <p className="text-slate-400 text-sm">{leave.type} Leave</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">
                    {new Date(leave.from).toLocaleDateString()} - {new Date(leave.to).toLocaleDateString()}
                  </p>
                  <p className="text-emerald-400 text-sm font-semibold">{leave.days} days</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaveApproval;