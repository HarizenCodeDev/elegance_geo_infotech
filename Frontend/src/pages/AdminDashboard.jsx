import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../hooks/useTheme.js";
import Logo from "/EGlogo.png";
import ChatWindow from "../components/ChatWindow";
import AttendanceChart from "../components/AttendanceChart";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiLock, FiLogOut } from "react-icons/fi";
import axios from "axios";
import AddEmployeeForm from "../components/AddEmployeeForm";
import EmployeesList from "../components/EmployeesList";
import EmployeeDetails from "../components/EmployeeDetails";
import LeavesList from "../components/LeavesList";
import AttendanceList from "../components/AttendanceList";
import EditEmployeeForm from "../components/EditEmployeeForm";
import AddAnnouncementForm from "../components/AddAnnouncementForm";
import AnnouncementsList from "../components/AnnouncementsList";
import PayrollList from './PayrollList';
import GeneratePayslip from './GeneratePayslip';
import LeaveDashboard from "../components/LeaveDashboard";
import LeaveApproval from "../components/LeaveApproval";

import { navConfig } from "../navConfig";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AdminDashboard = () => {
  const { user, logout, updateAvatar } = useAuth();
  const menu = navConfig[user?.role] || [];
  const [openIndex, setOpenIndex] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
const [currentView, setCurrentView] = useState("dashboard"); // dashboard | addEmployee | chat | announcements
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const loadStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch {
        // Fallback to empty stats
      }
    };
    loadStats();
    const interval = setInterval(loadStats, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user?.avatar || user?.profileImage) {
      setProfileImage(user.avatar || user.profileImage);
    }
  }, [user?.avatar, user?.profileImage]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!profileOpen) return;
      const dropdown = document.getElementById("profile-dropdown");
      const button = document.getElementById("profile-button");
      if (dropdown && !dropdown.contains(e.target) && button && !button.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileOpen]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    if (typeof logout === "function") logout();
    navigate("/login");
  };

  const handleToggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index)); // only one open at a time
  };

  const renderMain = () => {
    if (currentView === "chat" || chatOpen) {
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
    }
    if (currentView === "addEmployee") {
      return (
        <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
          <AddEmployeeForm />
        </section>
      );
    }
    if (currentView === "attendance") {
      return (
        <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
          <AttendanceList />
        </section>
      );
    }
    if (currentView === "editEmployee" && selectedEmployee) {
      return (
        <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
          <EditEmployeeForm
            employee={selectedEmployee}
            onDone={() => {
              setCurrentView("employeesList");
              setSelectedEmployee(null);
            }}
          />
        </section>
      );
    }
    if (currentView === "employeeDetails" && selectedEmployee) {
      return (
        <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
          <EmployeeDetails
            employee={selectedEmployee}
            onBack={() => {
              setCurrentView("employeesList");
              setSelectedEmployee(null);
            }}
          />
        </section>
      );
    }
    if (currentView === "employeesList") {
      return (
        <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
          <EmployeesList
            onAddNew={() => setCurrentView("addEmployee")}
            onView={(emp) => {
              setSelectedEmployee(emp);
              setCurrentView("employeeDetails");
            }}
            onEdit={(emp) => {
              setSelectedEmployee(emp);
              setCurrentView("editEmployee");
            }}
          />
        </section>
      );
    }
    if (currentView === "payrollList") {
      return (
        <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
          <PayrollList />
        </section>
      );
    }
    if (currentView === "generatePayslip") {
      return (
        <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
          <GeneratePayslip />
        </section>
      );
    }
    if (currentView === "leaveDashboard") {
      return (
        <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
          <LeaveDashboard />
        </section>
      );
    }
    if (currentView === "leaveApproval") {
      return (
        <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
          <LeaveApproval onBack={() => setCurrentView("leaves")} />
        </section>
      );
    }
    if (currentView === "leaves") {
      return (
        <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
          <LeavesList />
        </section>
      );
    }
    if (currentView === "addAnnouncement") {
      return (
        <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
          <AddAnnouncementForm onCreated={() => setCurrentView("announcementList")} />
        </section>
      );
    }
    if (currentView === "announcementList") {
      return (
        <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
          <AnnouncementsList title="Announcements" />
        </section>
      );
    }
    return (
      <section className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
          {[
            { label: "Total Employees", value: stats.totalUsers || 0, gradient: "from-indigo-400 via-violet-400 to-fuchsia-400" },
            { label: "Today Present", value: stats.todayPresent || 0, gradient: "from-emerald-400 via-teal-400 to-cyan-400" },
            { label: "On Leave", value: stats.onLeave || 0, gradient: "from-rose-400 via-pink-400 to-orange-300" },
            { label: "Absent", value: stats.todayAbsent || 0, gradient: "from-amber-400 via-yellow-400 to-lime-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg"
            >
              <div
                className={`absolute inset-0 opacity-90 bg-gradient-to-br ${stat.gradient}`}
                aria-hidden="true"
              />
              <div className="relative flex flex-col gap-3 text-white">
                <div className="text-sm uppercase tracking-wide text-white/80">{stat.label}</div>
                <div className="text-3xl font-bold drop-shadow-sm">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>
        <AttendanceChart />
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white flex flex-col">
      <header className="bg-white dark:bg-slate-800 px-6 py-4 shadow flex items-center gap-3 relative border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <img src={Logo} alt="Elegance Geo Infotech" className="h-9 w-9 object-contain" />
          <h1 className="text-xl font-semibold">Elegance Geo Infotech</h1>
        </div>
        <div className="ml-auto relative">
          <button
            type="button"
            id="profile-button"
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center gap-3 focus:outline-none"
          >
              <div className="text-right leading-tight hidden sm:block">
                <div className="text-sm font-semibold text-white">{user?.name || "John Doe"}</div>
                <div className="text-xs text-slate-300 capitalize">{user?.role || "Admin"}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white font-semibold overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                (user?.name || "JD").slice(0, 2).toUpperCase()
              )}
            </div>
          </button>

          {profileOpen && (
            <div
              id="profile-dropdown"
              className="absolute right-0 mt-3 w-64 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-4 space-y-4 z-10"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white font-semibold overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    (user?.name || "JD").slice(0, 2).toUpperCase()
                  )}
                  <button
                    type="button"
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white text-slate-700 flex items-center justify-center shadow"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadError("");
                      setUploading(true);
                      try {
                        const fd = new FormData();
                        fd.append("avatar", file);
                        const token = localStorage.getItem("token");
                        const res = await axios.post(`${API_BASE}/api/auth/avatar`, fd, {
                          headers: {
                            "Content-Type": "multipart/form-data",
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                          },
                        });
                        const url = res.data?.avatarUrl || URL.createObjectURL(file);
                        setProfileImage(url);
                        if (updateAvatar) updateAvatar(url);
                      } catch (err) {
                        const msg =
                          err.response?.data?.error ||
                          err.message ||
                          "Upload failed. Please try again.";
                        setUploadError(msg);
                        console.error("Avatar upload error:", err);
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-white">{user?.name || "John Doe"}</div>
                  <div className="text-xs text-slate-300 capitalize">{user?.role || "Admin"}</div>
                </div>
              </div>

              {uploading && <div className="text-xs text-slate-400">Uploading...</div>}
              {uploadError && <div className="text-xs text-rose-400">{uploadError}</div>}

              <button
                type="button"
                onClick={() => navigate("/change-password")}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-sm text-slate-200"
              >
                <FiLock className="text-slate-300" />
                Change Password
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-sm text-rose-300"
              >
                <FiLogOut className="text-rose-300" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-72 bg-white/90 dark:bg-slate-800/80 border-r border-gray-200 dark:border-slate-700 px-5 py-6 space-y-6">
          <h2 className="text-lg font-semibold pb-2 border-b border-slate-700">
            {user?.name || "Dashboard"}
          </h2>
          <button
            onClick={toggleTheme}
            className="mb-4 px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-sm transition border border-slate-600"
          >
            {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          </button>
          <nav className="space-y-4">
            {menu.map((section, idx) => (
              <React.Fragment key={section.title}>
                <div className="bg-slate-800 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 font-medium"
                    onClick={() => {
                      if (section.view) {
                        setCurrentView(section.view);
                        setChatOpen(section.view === "chat");
                        setOpenIndex(null);
                      } else if (section.items && section.items.length > 0) {
                        handleToggle(idx);
                      } else if (section.title === "Leave Request") {
                        setCurrentView("leaveApproval");
                        setChatOpen(false);
                        setOpenIndex(null);
                      } else {
                        setCurrentView("dashboard");
                        setChatOpen(false);
                        setSelectedEmployee(null);
                        setOpenIndex(null);
                      }
                    }}
                  >
                    {section.title}
                    {section.items && section.items.length > 0 && (
                      <span className={`text-slate-400 transition ${openIndex === idx ? "rotate-90" : ""}`}>
                        &#8250;
                      </span>
                    )}
                  </button>
                  {section.items && section.items.length > 0 && (
                    <div
                      className={`bg-slate-900/40 border-t border-slate-700 transition-all ${
                        openIndex === idx ? "max-h-40 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                      }`}
                    >
                      {section.items.map((item) => (
                        <div
                          key={item}
                          className="px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/60 cursor-pointer transition"
                          onClick={() => {
                            if (item === "Add Employees") {
                              setCurrentView("addEmployee");
                              setChatOpen(false);
                            } else if (item === "Employees List") {
                              setCurrentView("employeesList");
                              setSelectedEmployee(null);
                              setChatOpen(false);
                            } else if (item === "Add Attendence") {
                              setCurrentView("attendance");
                              setChatOpen(false);
                            } else if (item === "Leave Dashboard") {
                              setCurrentView("leaveDashboard");
                              setChatOpen(false);
                            } else if (item === "Generate Payslip") {
                              setCurrentView("generatePayslip");
                              setChatOpen(false);
                            } else if (item === "Payroll List") {
                              setCurrentView("payrollList");
                              setChatOpen(false);
                            } else if (item === "Add Announcement") {
                              setCurrentView("addAnnouncement");
                              setChatOpen(false);
                            } else if (item === "Announcement List") {
                              setCurrentView("announcementList");
                              setChatOpen(false);
                            } else {
                              setCurrentView("dashboard");
                              setChatOpen(false);
                            }
                          }}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </React.Fragment>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {renderMain()}
        </main>
      </div>

      <footer className="bg-slate-800 px-6 py-3 text-center text-sm text-slate-300 border-t border-slate-700">
        &copy; 2026 Your Website | All Rights Reserved
      </footer>
    </div>
  );
};

export default AdminDashboard;