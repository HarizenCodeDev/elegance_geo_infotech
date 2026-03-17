import React, { useState } from "react";
import Logo from "../assets/Logo/EGlogo.png";
import ChatWindow from "../components/ChatWindow";
import EmployeeLeaves from "../components/EmployeeLeaves";
import EmployeeAttendanceView from "../components/EmployeeAttendanceView";
import EmployeeAnnouncements from "../components/EmployeeAnnouncements";
import { useAuth } from "../context/authContext";

const cards = [
  { label: "This Month Present", value: 18, gradient: "from-emerald-400 via-teal-400 to-cyan-400" },
  { label: "This Month Absent", value: 2, gradient: "from-rose-400 via-pink-400 to-orange-300" },
];

const miniCharts = [
  { title: "Last 7 Days", data: [5, 4, 6, 5, 6, 5, 5] },
  { title: "Last Month (weeks)", data: [20, 18, 22, 21] },
  { title: "Current Year (months)", data: [20, 18, 22, 19, 23, 21, 20, 22, 19, 20, 21, 18] },
];

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");
  const [chatOpen, setChatOpen] = useState(false);
  const avatar = user?.avatar || user?.profileImage;

  const renderMain = () => {
    if (currentView === "chat" || chatOpen)
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Chat</h3>
            <button
              type="button"
              onClick={() => {
                setChatOpen(false);
                setCurrentView("dashboard");
              }}
              className="text-sm text-slate-200 underline"
            >
              Close
            </button>
          </div>
          <div className="h-[70vh]">
            <ChatWindow />
          </div>
        </div>
      );

    if (currentView === "leaves") return <EmployeeLeaves />;
    if (currentView === "attendance") return <EmployeeAttendanceView />;
    if (currentView === "announcements") return <EmployeeAnnouncements />;

    // dashboard
    return (
      <section className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg"
            >
              <div
                className={`absolute inset-0 opacity-90 bg-gradient-to-br ${card.gradient}`}
                aria-hidden="true"
              />
              <div className="relative flex flex-col gap-3 text-white">
                <div className="text-sm uppercase tracking-wide text-white/80">{card.label}</div>
                <div className="text-3xl font-bold drop-shadow-sm">{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {miniCharts.map((chart) => {
            const max = Math.max(...chart.data, 1);
            return (
              <div
                key={chart.title}
                className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 shadow"
              >
                <div className="text-sm font-semibold text-white mb-2">{chart.title}</div>
                <div className="flex items-end gap-2 h-32">
                  {chart.data.map((v, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <div
                        className="w-full rounded-md bg-gradient-to-t from-indigo-500 to-cyan-400"
                        style={{ height: `${(v / max) * 100}%`, minHeight: 6 }}
                      />
                      <div className="text-[10px] text-slate-400">#{i + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="bg-slate-800 px-6 py-4 shadow flex items-center gap-3">
        <div className="flex items-center gap-3">
          <img src={Logo} alt="Elegance Geo Infotech" className="h-9 w-9 object-contain" />
          <h1 className="text-xl font-semibold">Elegance Geo Infotech</h1>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-right leading-tight hidden sm:block">
            <div className="text-sm font-semibold text-white">{user?.name || "Developer"}</div>
            <div className="text-xs text-slate-300 capitalize">{user?.role || "developer"}</div>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white font-semibold">
            {avatar ? (
              <img src={avatar} alt="Profile" className="h-full w-full object-cover rounded-full" />
            ) : (
              (user?.name || "DEV").slice(0, 2).toUpperCase()
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-72 bg-slate-800/80 border-r border-slate-700 px-5 py-6 space-y-4">
          <h2 className="text-lg font-semibold pb-2 border-b border-slate-700">
            {user?.name || "Main"}
          </h2>
          <nav className="space-y-3">
            <button
              className="w-full text-left px-4 py-2 rounded-lg bg-slate-800 border border-slate-700"
              onClick={() => {
                setCurrentView("dashboard");
                setChatOpen(false);
              }}
            >
              Dashboard
            </button>
            <button
              className="w-full text-left px-4 py-2 rounded-lg bg-slate-800 border border-slate-700"
              onClick={() => {
                setCurrentView("leaves");
                setChatOpen(false);
              }}
            >
              Leave Request
            </button>
            <button
              className="w-full text-left px-4 py-2 rounded-lg bg-slate-800 border border-slate-700"
              onClick={() => {
                setCurrentView("attendance");
                setChatOpen(false);
              }}
            >
              Attendance
            </button>
            <button
              className="w-full text-left px-4 py-2 rounded-lg bg-slate-800 border border-slate-700"
              onClick={() => {
                setCurrentView("announcements");
                setChatOpen(false);
              }}
            >
              Announcement
            </button>
            <div className="bg-slate-800 rounded-lg border border-slate-700">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 font-medium"
                onClick={() => {
                  setChatOpen(true);
                  setCurrentView("chat");
                }}
              >
                <span className="flex items-center gap-2">Chat</span>
                <span className="text-slate-400">&#8250;</span>
              </button>
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-8">{renderMain()}</main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
