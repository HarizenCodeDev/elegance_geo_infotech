import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const GeneratePayslip = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [deductions, setDeductions] = useState('0');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/employees`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEmployees(res.data.users || []);
    } catch (err) {
      console.error('Employees fetch error', err);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!employeeId || !month) return setMessage('Employee and month required');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/payroll/generate`, {
        employeeId,
        month,
        baseSalary: baseSalary || '',
        deductions
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessage(`Payslip generated: /${res.data.payroll.pdfPath}`);
      setBaseSalary('');
      setDeductions('0');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to generate payslip');
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployee = employees.find(e => e.id === employeeId);

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Generate Payslip</h1>
      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Employee</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
          >
            <option value="">Select Employee</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.employeeId || 'N/A'})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Month (YYYY-MM)</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Base Salary (override)</label>
          <input
            type="number"
            step="0.01"
            value={baseSalary}
            onChange={(e) => setBaseSalary(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
            placeholder={selectedEmployee?.salary ? `$${selectedEmployee.salary}` : 'Auto from employee'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Deductions</label>
          <input
            type="number"
            step="0.01"
            value={deductions}
            onChange={(e) => setDeductions(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-500 disabled:opacity-50 font-semibold"
        >
          {loading ? 'Generating...' : 'Generate PDF Payslip'}
        </button>
      </form>
      {message && (
        <div className={`mt-4 p-3 rounded-md ${message.includes('generated') ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default GeneratePayslip;

