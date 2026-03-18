
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import { FiSend, FiCheck } from "react-icons/fi";

const ChatWindow = ({ activeContact, socket, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const roomKey = useMemo(() => {
    if (!activeContact || !currentUser) return null;
    return [currentUser.id, activeContact.id].sort().join("-");
  }, [activeContact, currentUser]);

  const fetchMessages = useCallback(async (newCursor) => {
    if (!activeContact) return;
    try {
      const res = await axios.get(`/api/chat`, {
        params: {
          contactId: activeContact.id,
          type: "direct",
          cursor: newCursor,
          limit: 20,
        },
      });
      setMessages((prev) => [...res.data.messages, ...prev]);
      if (res.data.messages.length < 20) {
        setHasMore(false);
      } else {
        setCursor(res.data.messages[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }, [activeContact]);

  useEffect(() => {
    if (activeContact) {
      setMessages([]);
      setCursor(null);
      setHasMore(true);
    }
  }, [activeContact]);

  useEffect(() => {
    if (activeContact) {
      fetchMessages(null);
    }
  }, [activeContact, fetchMessages]);

  const markAsRead = async (messageId) => {
    try {
      await axios.put(`/api/chat/messages/${messageId}/read`);
    } catch (err) {
      console.error("Failed to mark message as read:", err);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on("message", (message) => {
        if (
          (message.fromId === activeContact?.id &&
            message.toUserId === currentUser?.id) ||
          (message.fromId === currentUser?.id &&
            message.toUserId === activeContact?.id)
        ) {
          setMessages((prev) => [...prev, message]);
        }
      });

      socket.on("typing", ({ isTyping }) => {
        setIsTyping(isTyping);
      });

      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        socket.off("message");
        socket.off("typing");
      };
    }
  }, [socket, activeContact, currentUser]);

  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.toUserId === currentUser?.id && !msg.read) {
        markAsRead(msg.id);
      }
    });
  }, [messages, currentUser]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (socket) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit("typing", { roomKey, isTyping: true });
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing", { roomKey, isTyping: false });
      }, 2000);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (text.trim() === "") return;

    const newMessage = {
      text,
      fromId: currentUser.id,
      toUserId: activeContact.id,
      contactId: activeContact.id,
      type: "direct",
    };

    socket.emit("message", { roomKey, message: newMessage });
    setMessages((prev) => [...prev, { ...newMessage, from: currentUser }]);
    setText("");
    if (socket) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit("typing", { roomKey, isTyping: false });
    }
  };

  if (!activeContact) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Select a contact to start chatting
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-800 text-white">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold">{activeContact.name}</h2>
        {isTyping && <p className="text-sm text-gray-400">typing...</p>}
      </div>
      <div className="flex-1 p-4 overflow-y-auto" ref={chatContainerRef}>
        {hasMore && (
          <div className="text-center">
            <button
              onClick={() => fetchMessages(cursor)}
              className="text-blue-400 hover:underline"
            >
              Load More
            </button>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-4 flex ${
              msg.fromId === currentUser.id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-md ${
                msg.fromId === currentUser.id
                  ? "bg-blue-600"
                  : "bg-gray-700"
              }`}
            >
              <p>{msg.text}</p>
              <div className="flex items-center justify-end text-xs text-gray-400 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString()}
                {msg.fromId === currentUser.id && msg.read && (
                  <FiCheck className="ml-1" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSend} className="flex items-center">
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 rounded-full px-4 py-2 focus:outline-none"
          />
          <button
            type="submit"
            className="ml-4 bg-blue-600 rounded-full p-3 hover:bg-blue-700"
          >
            <FiSend />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;