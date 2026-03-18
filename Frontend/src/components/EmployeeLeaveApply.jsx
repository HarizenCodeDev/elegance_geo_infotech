import React, { useState } from 'react';
import axios from 'axios';
// import { useAuth } from '../context/authContext'; // not used in this component

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const EmployeeLeaveApply = ({ onBack }) => {
  // const { user } = useAuth(); // user is not used in this component
  const [formData, setFormData] = useState({
    type: 'Annual',
    from: '',
    to: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');

    // Basic validation
    const fromDate = new Date(formData.from);
    const toDate = new Date(formData.to);
    if (fromDate >= toDate) {
      alert('To date must be after from date');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // const res = await axios.post(`${API_BASE}/api/leaves`, formData, {
      await axios.post(`${API_BASE}/api/leaves`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Leave request submitted successfully!');
      setFormData({ type: 'Annual', from: '', to: '', description: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Apply Leave</h2>
        <button onClick={onBack} className="text-slate-400 hover:text-white">
          ×
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500 rounded text-emerald-100">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-300">Leave Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          >
            <option>Annual</option>
            <option>Sick</option>
            <option>Casual</option>
            <option>Maternity</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-300">From Date</label>
          <input
            type="date"
            value={formData.from}
            onChange={(e) => setFormData({...formData, from: e.target.value})}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-300">To Date</label>
          <input
            type="date"
            value={formData.to}
            onChange={(e) => setFormData({...formData, to: e.target.value})}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-300">Reason</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows="3"
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded focus:ring-2 focus:ring-indigo-500 resize-vertical"
            placeholder="Medical certificate, family event, etc."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition"
        >
          {loading ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </form>
    </div>
  );
};

export default EmployeeLeaveApply;