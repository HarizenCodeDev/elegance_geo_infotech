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

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const menu = [
  { title: "Employees", items: ["Add Employees", "Employees List"] },
  { title: "Performance Reviews", items: ["Reviews List", "Add Review"] },
  { title: "Leave Request", items: [] },
  { title: "Payroll", items: ["Generate Payslip", "Payroll List"] },
  { title: "Attendence", items: ["Add Attendence"] },
  { title: "Announcement", items: ["Add Announcement", "Announcement List"] },
];

const AdminDashboard = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(true);
  const { user, logout, updateAvatar } = useAuth();
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
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <nav className="space-y-4">
            <div className="bg-slate-800 rounded-lg border border-slate-700">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 font-medium"
                onClick={() => {
                  setCurrentView("dashboard");
                  setChatOpen(false);
                  setSelectedEmployee(null);
                  setOpenIndex(null);
                }}
              >
                Dashboard
                <span className="text-slate-400">&#8250;</span>
              </button>
            </div>
                {menu.map((section, idx) => (
                  <React.Fragment key={section.title}>
                    <div className="bg-slate-800 rounded-lg border border-slate-700">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-3 font-medium"
                        onClick={() => {
                          if (section.items.length === 0 && section.title === "Leave Request") {
                            if (section.title === "Leave Request") {
                              setCurrentView("leaveApproval");
                            } else {
                              setCurrentView("leaves");
                            }
                            setChatOpen(false);
                            setOpenIndex(null);
                          } else {
                            handleToggle(idx);
                          }
                        }}
                      >
                        {section.title}
                        {section.items.length > 0 && (
                          <span className={`text-slate-400 transition ${openIndex === idx ? "rotate-90" : ""}`}>
                            &#8250;
                          </span>
                        )}
                      </button>
                      {section.items.length > 0 && (
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
                                }
                            if (item === "Generate Payslip") {
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

                {idx === 0 && (
                  <div className="bg-slate-800 rounded-lg border border-slate-700">
                    <button
                      type="button"
                    className="flex w-full items-center justify-between px-4 py-3 font-medium"
                    onClick={() => {
                        setChatOpen(true);
                        setChatUnread(false);
                        setCurrentView("chat");
                    }}
                  >
                      <span className="flex items-center gap-2">
                        Chat
                        {chatUnread && <span className="h-2.5 w-2.5 rounded-full bg-red-500" />}
                      </span>
                      <span className="text-slate-400">&#8250;</span>
                    </button>
                  </div>
                )}
              </React.Fragment>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {currentView === "chat" || chatOpen ? (
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
          ) : currentView === "addEmployee" ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <AddEmployeeForm />
            </section>
          ) : currentView === "attendance" ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <AttendanceList />
            </section>
          ) : currentView === "editEmployee" && selectedEmployee ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <EditEmployeeForm
                employee={selectedEmployee}
                onDone={() => {
                  setCurrentView("employeesList");
                  setSelectedEmployee(null);
                }}
              />
            </section>
          ) : currentView === "employeeDetails" && selectedEmployee ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <EmployeeDetails
                employee={selectedEmployee}
                onBack={() => {
                  setCurrentView("employeesList");
                  setSelectedEmployee(null);
                }}
              />
            </section>
          ) : currentView === "employeesList" ? (
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
          ) : currentView === "payrollList" ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <PayrollList />
            </section>
          ) : currentView === "generatePayslip" ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <GeneratePayslip />
            </section>
          ) : currentView === "leaveApproval" ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <LeaveApproval onBack={() => setCurrentView("leaves")} />
            </section>
          ) : currentView === "leaves" ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <LeavesList />
            </section>
          ) : currentView === "addAnnouncement" ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <AddAnnouncementForm onCreated={() => setCurrentView("announcementList")} />
            </section>
          ) : currentView === "announcementList" ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <ReviewsList />
            </section>
          ) : currentView === "addReview" ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <AddReviewForm onDone={() => setCurrentView("reviewsList")} />
            </section>
          ) : currentView === "announcementList" ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <AnnouncementsList title="Announcements" />
            </section>
          ) : (
            <section className="space-y-6">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
                {[
                  { label: "Total Employees", value: stats.totalUsers || 0, gradient: "from-indigo-400 via-violet-400 to-fuchsia-400" },
                  { label: "Today Present", value: stats.todayPresent || 0, gradient: "from-emerald-400 via-teal-400 to-cyan-400" },
                  { label: "Today Absent", value: stats.todayAbsent || 0, gradient: "from-rose-400 via-pink-400 to-orange-300" },
                  { label: "Leave Requests", value: stats.pendingLeaves || 0, gradient: "from-amber-400 via-orange-400 to-rose-300" },
                  { label: "Leave Approved", value: stats.approvedLeaves || 0, gradient: "from-sky-400 via-cyan-400 to-emerald-300" },
                  { label: "Developers", value: stats.developers || 0, gradient: "from-cyan-400 via-blue-400 to-indigo-400" },
                  { label: "Attendance Today", value: stats.todayAttendance || 0, gradient: "from-lime-300 via-emerald-300 to-green-400" },
                  { label: "Late Arrivals", value: stats.latePunches || 0, gradient: "from-red-400 via-rose-400 to-orange-400" },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg h-full flex flex-col justify-between"
                  >
                    <div
                      className={`absolute inset-0 opacity-90 bg-gradient-to-br ${card.gradient}`}
                      aria-hidden="true"
                    />
                    <div className="relative flex flex-col gap-3 text-white">
                      <div className="text-sm uppercase tracking-wide text-white/80">{card.label}</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold drop-shadow-sm">{card.value}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                          Live
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <AttendanceChart data={stats.weeklyAttendance || []} />
            </section>
          )}
        </main>
      </div>

      <footer className="bg-slate-800 px-6 py-3 text-center text-sm text-slate-300 border-t border-slate-700">
        &copy; 2026 Your Website | All Rights Reserved
      </footer>
    </div>
  );
};

export default AdminDashboard;
