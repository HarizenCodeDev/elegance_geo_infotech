import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/authContext";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const directContactsStatic = [];

const groupContacts = [
  { id: "grp-hr", name: "HR", allowedRoles: ["admin", "manager", "root"] },
  { id: "grp-bd", name: "Buisness Development", allowedRoles: ["admin", "manager", "root", "developer", "teamlead"] },
  { id: "grp-dev", name: "Development", allowedRoles: ["teamlead", "developer", "root"] }, // excludes HR/admin/manager per request
  { id: "grp-team1", name: "Team1", allowedRoles: ["teamlead", "developer", "root"] },
  { id: "grp-team2", name: "Team2", allowedRoles: ["teamlead", "developer", "root"] },
];

const starterByContact = {
  alex: [
    { id: 1, author: "Alex", text: "Hey, need the latest attendance?" },
    { id: 2, author: "You", text: "I’ll send it in a minute." },
  ],
  jordan: [
    { id: 3, author: "Jordan", text: "Payroll draft is ready for review." },
    { id: 4, author: "You", text: "Great, looking now." },
  ],
  sam: [{ id: 5, author: "Sam", text: "Let’s sync at 3 PM?" }],
  you: [{ id: 6, author: "You", text: "Notes to self go here." }],
  "grp-hr": [{ id: 7, author: "HR Bot", text: "Welcome to HR group." }],
  "grp-bd": [{ id: 8, author: "BD Lead", text: "Share leads updates here." }],
  "grp-dev": [{ id: 9, author: "Dev Lead", text: "Sprint planning at 4 PM." }],
  "grp-team1": [{ id: 10, author: "Team1", text: "Daily standup notes." }],
  "grp-team2": [{ id: 11, author: "Team2", text: "Share blockers here." }],
};

const ChatWindow = () => {
  const { user } = useAuth();
  const role = (user && user.role) || "employee";
  const userId = user?._id;
  const [directContacts, setDirectContacts] = useState(directContactsStatic);

  const visibleGroups = useMemo(
    () => groupContacts.filter((g) => g.allowedRoles?.includes(role)),
    [role]
  );

  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState({});
  const [text, setText] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/employees`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const contacts =
          res.data?.users
            ?.filter((u) => u._id !== userId)
            .map((u) => ({ id: u._id, name: u.name })) || [];
        setDirectContacts(contacts);
        if (!activeContact && contacts.length > 0) {
          setActiveContact(contacts[0].id);
        } else if (!activeContact && visibleGroups.length > 0) {
          setActiveContact(visibleGroups[0].id);
        }
      } catch {
        // ignore
      }
    };
    loadContacts();
  }, [userId, visibleGroups.length, activeContact]);

  const loadMessages = async (contactId = activeContact) => {
    if (!contactId) return;
      try {
        setChatError("");
        const token = localStorage.getItem("token");
        const isGroup = visibleGroups.some((g) => g.id === contactId);
        const res = await axios.get(`${API_BASE}/api/chat`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params: { contactId, type: isGroup ? "group" : "direct" },
        });
        setMessages((prev) => ({ ...prev, [contactId]: res.data?.messages || [] }));
      } catch (err) {
        setChatError(err.response?.data?.error || err.message || "Failed to load messages");
      }
    };

  useEffect(() => {
    loadMessages();
  }, [activeContact, visibleGroups]);

  // polling to receive new messages from others
  useEffect(() => {
    if (!activeContact) return;
    const interval = setInterval(() => loadMessages(activeContact), 3000);
    return () => clearInterval(interval);
  }, [activeContact, visibleGroups]);

  const currentMessages = useMemo(() => {
    const msgs = messages[activeContact] || [];
    return msgs.map((m) => {
      const author = m.author || m.from?.name || "Unknown";
      const senderId = m.from?._id || m.from;
      const senderString = senderId?.toString?.() || senderId;
      const isYou = author === "You" || senderString === userId;
      return { ...m, id: m._id || m.id, author, isYou };
    });
  }, [messages, activeContact, userId]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const entry = { id: Date.now(), author: "You", text: text.trim(), isYou: true };
    const isGroup = visibleGroups.some((g) => g.id === activeContact);
    setMessages((prev) => ({
      ...prev,
      [activeContact]: [...(prev[activeContact] || []), entry],
    }));
    setText("");
    const token = localStorage.getItem("token");
    axios
      .post(
        `${API_BASE}/api/chat`,
        { contactId: activeContact, type: isGroup ? "group" : "direct", text: entry.text },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      .then(() => loadMessages(activeContact))
      .catch(() => {});
  };

  return (
    <div className="flex h-full rounded-xl border border-slate-800 bg-[#0b141a] text-slate-100">
      <aside className="w-64 border-r border-slate-800 bg-[#111b21]">
        <div className="px-4 py-3 border-b border-slate-800 space-y-2">
          <div className="text-xs uppercase tracking-wide text-slate-400">Direct</div>
          <input
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            placeholder="Search people..."
            className="w-full rounded-md border border-slate-800 bg-[#202c33] px-2 py-1 text-xs text-white placeholder-slate-500"
          />
        </div>
        <div className="flex flex-col max-h-72 overflow-y-auto">
          {directContacts
            .filter((c) => c.name.toLowerCase().includes(contactSearch.toLowerCase()))
            .map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveContact(c.id)}
                className={`flex items-center justify-between px-4 py-3 text-sm ${
                  activeContact === c.id
                    ? "bg-[#202c33] text-white"
                    : "text-slate-200 hover:bg-[#202c33]"
                }`}
              >
                <span>{c.name}</span>
                {activeContact === c.id && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
                )}
              </button>
            ))}
          {directContacts.filter((c) => c.name.toLowerCase().includes(contactSearch.toLowerCase())).length === 0 && (
            <div className="px-4 py-3 text-xs text-slate-500">No matches</div>
          )}
        </div>

        <div className="px-4 py-3 border-y border-slate-800 text-xs uppercase tracking-wide text-slate-400">
          Groups
        </div>
        <div className="flex flex-col pb-2">
          {visibleGroups.length === 0 && (
            <div className="px-4 py-3 text-xs text-slate-500">No groups available for your role.</div>
          )}
          {visibleGroups.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveContact(c.id)}
              className={`flex items-center justify-between px-4 py-3 text-sm ${
                activeContact === c.id
                  ? "bg-[#202c33] text-white"
                  : "text-slate-200 hover:bg-[#202c33]"
              }`}
            >
              <span>{c.name}</span>
              {activeContact === c.id && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
              )}
            </button>
          ))}
        </div>
      </aside>

      <section className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#202c33] rounded-tr-xl">
          <div>
            <div className="text-lg font-semibold">
              {directContacts.concat(visibleGroups).find((c) => c.id === activeContact)?.name || "Chat"}
            </div>
            <div className="text-xs text-emerald-400">
              {visibleGroups.some((g) => g.id === activeContact) ? "Group chat" : "Online"}
            </div>
          </div>
        </div>
        {chatError && <div className="px-4 py-2 text-xs text-rose-400 bg-[#1b242c] border-b border-slate-800">{chatError}</div>}

        <div className="flex-1 bg-[#0b141a] px-4 py-3 overflow-y-auto space-y-3">
          {currentMessages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.author === "You" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow ${
                  m.author === "You"
                    ? "bg-[#005c4b] text-white"
                    : "bg-[#202c33] text-slate-100"
                }`}
              >
                <div className="text-[11px] uppercase tracking-wide opacity-70 mb-1">{m.author}</div>
                <div>{m.text}</div>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={send}
          className="bg-[#202c33] border-t border-slate-800 rounded-b-xl px-3 py-3 flex items-center gap-2"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message"
            className="flex-1 rounded-full bg-[#2a3942] border border-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition"
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
};

export default ChatWindow;
