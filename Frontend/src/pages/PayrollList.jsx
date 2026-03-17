import React, { useCallback, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const PayrollList = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState('');

  const fetchPayroll = useCallback(async () => {
    try {
      const params = employeeId ? { employeeId } : {};
      const res = await axios.get(`${API_BASE}/api/payroll`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params
      });
      setPayrolls(res.data.payrolls || []);
    } catch (err) {
      console.error('Payroll fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  if (loading) return <div className="p-8 text-center">Loading payroll...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Payroll Records</h1>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Filter by Employee:</label>
        <input
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
          placeholder="Employee ID or leave empty for all"
        />
        <button onClick={fetchPayroll} className="ml-2 bg-indigo-600 px-4 py-2 rounded-md text-white hover:bg-indigo-500">
          Filter
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full bg-slate-800 border border-slate-700 rounded-lg">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="p-3 text-left text-sm font-semibold">Employee</th>
              <th className="p-3 text-left text-sm font-semibold">Month</th>
              <th className="p-3 text-left text-sm font-semibold">Base</th>
              <th className="p-3 text-left text-sm font-semibold">Deductions</th>
              <th className="p-3 text-left text-sm font-semibold">Net Pay</th>
              <th className="p-3 text-left text-sm font-semibold">PDF</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map((p) => (
              <tr key={p.id} className="border-b border-slate-700 hover:bg-slate-700">
                <td className="p-3">{p.employee.name}</td>
                <td className="p-3">{p.month}</td>
                <td className="p-3">${p.baseSalary.toFixed(2)}</td>
                <td className="p-3">${p.deductions.toFixed(2)}</td>
                <td className="p-3 font-semibold">${p.netPay.toFixed(2)}</td>
                <td className="p-3">
                  {p.pdfPath ? (
                    <a href={`${API_BASE}${p.pdfPath}`} target="_blank" className="text-indigo-400 hover:underline">
                      Download
                    </a>
                  ) : (
                    'No PDF'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollList;

