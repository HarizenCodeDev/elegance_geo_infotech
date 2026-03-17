import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import { useSocket } from "../hooks/useSocket";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const directContactsStatic = [];

const groupContacts = [
  { id: "grp-hr", name: "HR", allowedRoles: ["admin", "manager", "root"] },
  { id: "grp-bd", name: "Business Development", allowedRoles: ["admin", "manager", "root", "developer", "teamlead"] },
  { id: "grp-dev", name: "Development", allowedRoles: ["teamlead", "developer", "root"] },
  { id: "grp-team1", name: "Team1", allowedRoles: ["teamlead", "developer", "root"] },
  { id: "grp-team2", name: "Team2", allowedRoles: ["teamlead", "developer", "root"] },
];

const ChatWindow = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const role = (user && user.role) || "employee";
  const userId = user?.id;
  const [directContacts, setDirectContacts] = useState(directContactsStatic);

  const visibleGroups = useMemo(
    () => groupContacts.filter((g) => g.allowedRoles?.includes(role)),
    [role]
  );

  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState({});
  const [text, setText] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [chatError, _setChatError] = useState(""); // Used for error display

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/employees`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const contacts =
          res.data?.users
            ?.filter((u) => u.id !== userId)
            .map((u) => ({ id: u.id, name: u.name })) || [];
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
  }, [userId, visibleGroups]); // eslint-disable-line react-hooks/exhaustive-deps





  useEffect(() => {
    if (socket && activeContact) {
      socket.emit("joinChat", activeContact);
      socket.on("chat message", (msg) => {
        setMessages((prev) => ({
          ...prev,
          [activeContact]: [...(prev[activeContact] || []), msg],
        }));
      });
      return () => {
        socket.off("chat message");
      };
    }
  }, [socket, activeContact]);

  const currentMessages = useMemo(() => {
    const msgs = messages[activeContact] || [];
    return msgs.map((m) => {
      const author = m.author || m.from?.name || "Unknown";
      const senderId = m.from?.id || m.from;
      const senderString = senderId?.toString?.() || senderId;
      const isYou = author === "You" || senderString === userId;
      return { ...m, id: m.id || m._id, author, isYou };
    });
  }, [messages, activeContact, userId]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    const entry = { id: Date.now(), author: "You", text: text.trim(), isYou: true };
    setMessages((prev) => ({
      ...prev,
      [activeContact]: [...(prev[activeContact] || []), entry],
    }));
    setText("");
    socket.emit("chat message", { roomKey: activeContact, text: entry.text });
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
              className={`flex ${m.isYou ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow ${
                  m.isYou
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
