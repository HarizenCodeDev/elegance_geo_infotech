import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import { Link } from "react-router-dom";
import { navConfig } from "../navConfig";
import Chat from "./Chat";
import Payslips from "./Payslips";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const DeveloperDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentView, setCurrentView] = useState("dashboard");
  const [openIndex, setOpenIndex] = useState(null);
  const [isChatOpen, setChatOpen] = useState(false);

  const menu = navConfig[user?.role] || [];

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/user/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch {
        setError("Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardContent stats={stats} loading={loading} error={error} />;
      case "payslips":
        return <Payslips />;
      case "chat":
        return <Chat />;
      default:
        return <DashboardContent stats={stats} loading={loading} error={error} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white flex-shrink-0">
        <div className="p-4">
          <h1 className="text-2xl font-bold">Developer</h1>
        </div>
        <nav className="mt-4">
          {menu.map((section, idx) => (
            <div key={section.title} className="mb-2">
              <button
                onClick={() => {
                  if (section.view) {
                    setCurrentView(section.view);
                    setChatOpen(section.view === "chat");
                    setOpenIndex(null);
                  } else {
                    handleToggle(idx);
                  }
                }}
                className="w-full text-left px-4 py-2 flex justify-between items-center hover:bg-gray-700"
              >
                {section.title}
                {section.items && <span>{openIndex === idx ? "-" : "+"}</span>}
              </button>
              {section.items && openIndex === idx && (
                <ul className="pl-8">
                  {section.items.map((item) => (
                    <li key={item} className="py-1">
                      <button
                        onClick={() => {
                          // Implement view switching for sub-items if needed
                        }}
                        className="hover:text-gray-300"
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">
        {renderContent()}
      </main>
      {isChatOpen && (
        <div className="fixed bottom-4 right-4 w-96 h-1/2">
          <Chat />
        </div>
      )}
    </div>
  );
};

const DashboardContent = ({ stats, loading, error }) => {
  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Personal Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg">Total Days</h3>
          <p className="text-gray-600">{stats?.totalDays}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg">Leaves</h3>
          <p className="text-gray-600">{stats?.totalLeaves}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg">Late Punches</h3>
          <p className="text-gray-600">{stats?.latePunches}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg">On-time Punches</h3>
          <p className="text-gray-600">{stats?.onTimePunches}</p>
        </div>
      </div>
      <div className="mt-4">
        <Link to="/payslips">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            My Payslips
          </button>
        </Link>
      </div>
    </div>
  );
};


export default DeveloperDashboard;