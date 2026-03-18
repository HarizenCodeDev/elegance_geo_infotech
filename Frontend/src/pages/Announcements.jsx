import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from "../context/authContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    audienceRoles: [],
    audienceDepartments: [],
  });

  const canCreateAnnouncement = user && ['admin', 'manager', 'hr'].includes(user.role);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnnouncements(res.data.announcements);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAnnouncement({ ...newAnnouncement, [name]: value });
  };

  const handleCheckboxChange = (e, type) => {
    const { value, checked } = e.target;
    const currentAudience = newAnnouncement[type];
    if (checked) {
      setNewAnnouncement({ ...newAnnouncement, [type]: [...currentAudience, value] });
    } else {
      setNewAnnouncement({ ...newAnnouncement, [type]: currentAudience.filter(item => item !== value) });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/api/announcements`, newAnnouncement, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewAnnouncement({ title: '', message: '', audienceRoles: [], audienceDepartments: [] });
      fetchAnnouncements(); // Refresh the list
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Announcements</h1>

      {canCreateAnnouncement && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Create New Announcement</h2>
          <div className="mb-4">
            <label className="block font-bold mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={newAnnouncement.title}
              onChange={handleInputChange}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-1">Message</label>
            <textarea
              name="message"
              value={newAnnouncement.message}
              onChange={handleInputChange}
              className="w-full border rounded-lg p-2"
              rows="4"
              required
            ></textarea>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold">Target Audience (Optional)</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="font-bold">Roles</p>
                {['developer', 'teamlead', 'manager', 'hr', 'admin'].map(role => (
                  <label key={role} className="flex items-center">
                    <input type="checkbox" value={role} onChange={e => handleCheckboxChange(e, 'audienceRoles')} />
                    <span className="ml-2">{role}</span>
                  </label>
                ))}
              </div>
              <div>
                <p className="font-bold">Departments</p>
                {['Engineering', 'HR', 'Sales', 'Marketing', 'Admin'].map(dept => (
                  <label key={dept} className="flex items-center">
                    <input type="checkbox" value={dept} onChange={e => handleCheckboxChange(e, 'audienceDepartments')} />
                    <span className="ml-2">{dept}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
            Post Announcement
          </button>
        </form>
      )}

      <div className="space-y-4">
        {announcements.map(ann => (
          <div key={ann.id} className="p-4 border rounded-lg shadow-sm">
            <div className="flex items-center mb-2">
              <img 
                src={ann.createdBy.profileImage ? `${API_BASE}${ann.createdBy.profileImage}` : 'https://via.placeholder.com/40'}
                alt={ann.createdBy.name}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <p className="font-bold">{ann.createdBy.name}</p>
                <p className="text-sm text-gray-500">{new Date(ann.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">{ann.title}</h2>
            <p>{ann.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;