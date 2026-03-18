
import React, { useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Reports = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!fromDate || !toDate) {
      setError("Please select both a 'from' and 'to' date.");
      return;
    }
    setError("");
    setDownloading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/attendance/export`, {
        params: { from: fromDate, to: toDate },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob", // Important for file downloads
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      const filename = `attendance_${fromDate}_to_${toDate}.xlsx`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.message ||
        "Failed to download report.";
      setError(message);
      console.error("Download error:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-800/60 border border-slate-700 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Reports & Analytics</h2>
      <div className="space-y-4">
        <div className="p-4 border border-slate-600 rounded-lg">
          <h3 className="font-semibold mb-2">Attendance Report</h3>
          <p className="text-sm text-slate-300 mb-4">
            Export a spreadsheet of attendance records for a selected date
            range.
          </p>
          <div className="flex items-center gap-4">
            <div>
              <label htmlFor="fromDate" className="block text-sm font-medium">
                From
              </label>
              <input
                type="date"
                id="fromDate"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="toDate" className="block text-sm font-medium">
                To
              </label>
              <input
                type="date"
                id="toDate"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="self-end px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:bg-slate-500"
            >
              {downloading ? "Downloading..." : "Download"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Reports;