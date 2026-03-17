import React, { useState } from "react";
import NotificationsList from "./NotificationsList";

const sampleMessages = [
  { id: 1, author: "Alex", text: "Hey team, any updates?" },
  { id: 2, author: "Jordan", text: "Payroll draft is ready for review." },
  { id: 3, author: "You", text: "On it, will check now." },
];

const ChatPanel = ({ variant = "button" }) => {
  const [openChat, setOpenChat] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(sampleMessages);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now(), author: "You", text: message.trim() }]);
    setMessage("");
  };

  const isNav = variant === "nav";

  const chatButton = (
    <button
      type="button"
      onClick={() => setOpenChat((p) => !p)}
      className={
        isNav
          ? "flex w-full items-center justify-between px-4 py-3 font-medium text-slate-200"
          : "flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition"
      }
    >
      <span className="flex items-center gap-2">
        <span className="text-lg leading-none">💬</span>
        <span>Chat</span>
      </span>
      {isNav && (
        <span className={`text-slate-400 transition ${openChat ? "rotate-90" : ""}`}>&#8250;</span>
      )}
    </button>
  );

  const notificationButton = (
    <button
      type="button"
      onClick={() => setOpenNotifications((p) => !p)}
      className={
        isNav
          ? "flex w-full items-center justify-between px-4 py-3 font-medium text-slate-200 mt-1"
          : "flex items-center gap-2 rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-orange-500 transition mt-2"
      }
    >
      <span className="flex items-center gap-2">
        <span className="text-lg leading-none">🔔</span>
        <span>Notifications</span>
      </span>
      {isNav && (
        <span className={`text-slate-400 transition ${openNotifications ? "rotate-90" : ""}`}>&#8250;</span>
      )}
    </button>
  );

  const panelBody = (
    <>
      <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-semibold text-indigo-300">{m.author}: </span>
            <span className="text-slate-100">{m.text}</span>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="border-t border-slate-700 px-3 py-3 flex items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message #general"
          className="flex-1 rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition"
        >
          Send
        </button>
      </form>
    </>
  );

  if (isNav) {
    return (
      <div className="space-y-2">
        {chatButton}
        <div className={`bg-slate-900/40 border border-slate-700 rounded-lg transition-all ${
          openChat ? "max-h-80 opacity-100 p-4" : "max-h-0 opacity-0 overflow-hidden"
        }`}>
          {openChat && panelBody}
        </div>
        {notificationButton}
        {openNotifications && (
          <div className="bg-slate-900 border border-slate-700 rounded-lg">
            <NotificationsList onClose={() => setOpenNotifications(false)} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {chatButton}
      {openChat && (
        <div className="w-full rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-4">
          <div className="text-sm font-semibold text-white mb-3">Team Chat</div>
          {panelBody}
        </div>
      )}
      {notificationButton}
      {openNotifications && (
        <div className="w-full rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
          <NotificationsList />
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
