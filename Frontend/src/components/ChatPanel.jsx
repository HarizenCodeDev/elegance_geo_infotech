import React, { useState } from "react";

const sampleMessages = [
  { id: 1, author: "Alex", text: "Hey team, any updates?" },
  { id: 2, author: "Jordan", text: "Payroll draft is ready for review." },
  { id: 3, author: "You", text: "On it, will check now." },
];

const ChatPanel = ({ variant = "button" }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(sampleMessages);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now(), author: "You", text: message.trim() }]);
    setMessage("");
  };

  const isNav = variant === "nav";

  const button = (
    <button
      type="button"
      onClick={() => setOpen((p) => !p)}
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
        <span className={`text-slate-400 transition ${open ? "rotate-90" : ""}`}>&#8250;</span>
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
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        {button}
        <div
          className={`bg-slate-900/40 border-t border-slate-700 transition-all ${
            open ? "max-h-80 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          {panelBody}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {button}

      {open && (
        <div className="absolute right-0 mt-3 w-80 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <div className="text-sm font-semibold text-white">Team Chat</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
          {panelBody}
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
