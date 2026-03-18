import React, { useEffect, useRef, useState } from "react";
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
import LeaveDashboard from "../components/LeaveDashboard";
import PasswordResetRequests from "../components/PasswordResetRequests";
import Notifications from "../components/Notifications";
import Reports from "../components/Reports";
import ReportsAndAnalytics from "../components/ReportsAndAnalytics";
import { navConfig } from "../navConfig";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const RootDashboard = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const { user, logout, updateAvatar } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [currentView, setCurrentView] = useState("dashboard"); // dashboard | addEmployee | announcements | chat
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const menu = navConfig[user?.role] || [];

  useEffect(() => {
    if (user?.avatar || user?.profileImage) {
      setProfileImage(user.avatar || user.profileImage);
    }
  }, [user?.avatar, user?.profileImage]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!profileOpen) return;
      const dropdown = document.getElementById("profile-dropdown-root");
      const button = document.getElementById("profile-button-root");
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
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="bg-slate-800 px-6 py-4 shadow flex items-center gap-3 relative">
        <div className="flex items-center gap-3">
          <img src={Logo} alt="Elegance Geo Infotech" className="h-9 w-9 object-contain" />
          <h1 className="text-xl font-semibold">Elegance Geo Infotech</h1>
        </div>
        <div className="ml-auto relative">
          <button
            type="button"
            id="profile-button-root"
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center gap-3 focus:outline-none"
          >
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-sm font-semibold text-white">{user?.name || "John Doe"}</div>
              <div className="text-xs text-slate-300 capitalize">{user?.role || "Root"}</div>
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
              id="profile-dropdown-root"
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
                <div className="text-xs text-slate-300 capitalize">{user?.role || "Root"}</div>
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
        <aside className="w-72 bg-slate-800/80 border-r border-slate-700 px-5 py-6 space-y-6">
          <h2 className="text-lg font-semibold pb-2 border-b border-slate-700">
            {user?.name || "Dashboard"}
          </h2>
          <nav className="space-y-4">
            {menu.map((section, idx) => (
              <div key={section.title} className="bg-slate-800 rounded-lg border border-slate-700">
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
                {openIndex === idx && section.items && (
                  <div className="px-4 pb-3">
                    <div className="border-t border-slate-700 pt-2 space-y-1">
                      {section.items.map((item) => (
                        <button
                          key={item}
                          className="w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-slate-700/80"
                          onClick={() => {
                            if (item === "Add Employees") {
                              setCurrentView("addEmployee");
                            } else if (item === "Employees List") {
                              setCurrentView("employeesList");
                              setSelectedEmployee(null);
                            } else if (item === "Leave Dashboard") {
                              setCurrentView("leaveDashboard");
                            } else if (item === "Password Resets") {
                              setCurrentView("passwordResets");
                            } else if (item === "View Reports") {
                              setCurrentView("reports");
                            }
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
          ) : currentView === "leaves" ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <LeavesList />
            </section>
          ) : currentView === "leaveDashboard" ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <LeaveDashboard />
            </section>
          ) : currentView === "passwordResets" ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <PasswordResetRequests />
            </section>
          ) : currentView === "reports" ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <Reports />
            </section>
          ) : currentView === "notifications" ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <Notifications />
            </section>
          ) : currentView === "addAnnouncement" ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <AddAnnouncementForm onCreated={() => setCurrentView("announcementList")} />
            </section>
          ) : currentView === "announcementList" ? (
            <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow">
              <AnnouncementsList title="Announcements" />
            </section>
          ) : (
            <section className="space-y-6">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
                {[
                  { label: "Total Present", value: 42, gradient: "from-emerald-400 via-teal-400 to-cyan-400" },
                  { label: "Total Developers", value: 58, gradient: "from-indigo-400 via-violet-400 to-fuchsia-400" },
                  { label: "Total Departments", value: 7, gradient: "from-cyan-400 via-blue-400 to-indigo-400" },
                  { label: "Total Absent", value: 6, gradient: "from-rose-400 via-pink-400 to-orange-300" },
                  { label: "Leave Requests", value: 5, gradient: "from-amber-400 via-orange-400 to-rose-300" },
                  { label: "Leave Approved", value: 3, gradient: "from-sky-400 via-cyan-400 to-emerald-300" },
                  { label: "Leave Rejected", value: 2, gradient: "from-gray-300 via-slate-400 to-slate-600" },
                  { label: "On-Time Punch", value: 47, gradient: "from-lime-300 via-emerald-300 to-green-400" },
                  { label: "Late Punch", value: 5, gradient: "from-red-400 via-rose-400 to-orange-400" },
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

              <AttendanceChart
                data={[
                  { label: "Mon", value: 52 },
                  { label: "Tue", value: 54 },
                  { label: "Wed", value: 50 },
                  { label: "Thu", value: 56 },
                  { label: "Fri", value: 55 },
                  { label: "Sat", value: 48 },
                  { label: "Sun", value: 46 },
                ]}
              />
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

export default RootDashboard;