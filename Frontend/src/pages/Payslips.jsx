import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Payslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/user/payslips`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPayslips(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPayslips();
    }
  }, [user]);

  const handleDownload = async (payrollId, month) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/user/payslips/${payrollId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `payslip-${month}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Payslips</h1>
      {payslips.length === 0 ? (
        <p>No payslips found.</p>
      ) : (
        <ul className="space-y-4">
          {payslips.map((payslip) => (
            <li
              key={payslip.id}
              className="p-4 border rounded-md flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">Month: {payslip.month}</p>
                <p>Net Salary: ${payslip.netSalary}</p>
              </div>
              <button
                onClick={() => handleDownload(payslip.id, payslip.month)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Payslips;