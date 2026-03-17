import React from "react";

const DetailRow = ({ label, value }) => (
  <div className="flex items-center gap-3 text-sm text-slate-800">
    <span className="font-semibold">{label}:</span>
    <span className="bg-indigo-100 text-slate-900 px-2 py-1 rounded">{value || "-"}</span>
  </div>
);

const EmployeeDetails = ({ employee, onBack }) => {
  const attendanceWeeks = [
    { label: "W1", value: 5 },
    { label: "W2", value: 4 },
    { label: "W3", value: 6 },
    { label: "W4", value: 5 },
  ];

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 space-y-6 text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Employee Details</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 items-start">
        <div className="flex justify-center">
          <div className="h-48 w-48 rounded-full overflow-hidden bg-slate-800 border border-slate-700">
            {employee.profileImage ? (
              <img src={employee.profileImage} alt={employee.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-lg text-slate-300">
                {employee.name?.slice(0, 2)?.toUpperCase() || "NA"}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <DetailRow label="Name" value={`${employee.name || "-"} (${employee.role || "Role"})`} />
          <DetailRow label="Employee ID" value={employee.employeeId} />
          <DetailRow
            label="Date of Birth"
            value={employee.dob ? new Date(employee.dob).toLocaleDateString() : "-"}
          />
          <DetailRow label="Gender" value={employee.gender} />
          <DetailRow label="Department" value={employee.department} />
          <DetailRow label="Marital Status" value={employee.maritalStatus} />
          <DetailRow label="Designation" value={employee.designation} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-center text-lg font-semibold text-white">Last Month Attendance</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/60">
          <table className="min-w-full text-sm text-slate-200">
            <thead className="bg-slate-800 text-slate-200 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 text-left">Week</th>
                <th className="px-3 py-2 text-left">Days Present</th>
              </tr>
            </thead>
            <tbody>
              {attendanceWeeks.map((d) => (
                <tr key={d.label} className="border-t border-slate-700">
                  <td className="px-3 py-2 text-slate-100">{d.label}</td>
                  <td className="px-3 py-2 text-slate-100">{d.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center">
          <div className="flex items-end gap-4 h-32">
            {attendanceWeeks.map((d) => {
              const max = Math.max(...attendanceWeeks.map((w) => w.value), 1);
              return (
                <div key={d.label} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 rounded-md bg-gradient-to-t from-indigo-500 to-cyan-400"
                    style={{ height: `${(d.value / max) * 100}%`, minHeight: 8 }}
                    title={`${d.label}: ${d.value}`}
                  />
                  <div className="text-[11px] text-slate-500">{d.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {onBack && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetails;
