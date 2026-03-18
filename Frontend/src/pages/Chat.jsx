import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/authContext';
import io from 'socket.io-client';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      // Fetch chat history
      const fetchHistory = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${API_BASE}/api/chat/history`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setMessages(res.data.messages);
        } catch (err) {
          console.error("Failed to fetch chat history", err);
        }
      };
      fetchHistory();

      // Setup socket connection
      socketRef.current = io(API_BASE, {
        query: { userId: user.id },
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to chat server');
        socketRef.current.emit('join', user.id);
      });

      socketRef.current.on('message', (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [user]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && user) {
      const message = {
        text: newMessage,
        senderId: user.id,
        timestamp: new Date(),
      };
      socketRef.current.emit('message', message);
      setNewMessage('');
    }
  };

  return (
    <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-100px)]">
      <h1 className="text-2xl font-bold mb-4">Group Chat</h1>
      <div className="border rounded-lg p-4 flex-grow overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-4 flex items-start ${msg.senderId === user.id ? 'justify-end' : ''}`}>
            <div className={`flex items-start gap-3 ${msg.senderId === user.id ? 'flex-row-reverse' : ''}`}>
              <img 
                src={msg.sender?.profileImage ? `${API_BASE}${msg.sender.profileImage}` : 'https://via.placeholder.com/40'} 
                alt={msg.sender?.name} 
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-bold">{msg.sender?.name || 'Unknown'}</p>
                <p className={`inline-block p-2 rounded-lg ${msg.senderId === user.id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                  {msg.text}
                </p>
                <p className="text-xs text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="mt-4 flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow border rounded-l-lg p-2"
          placeholder="Type a message..."
        />
        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-lg">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;