import React, { useState, useEffect } from 'react';

// It's a good practice to store API URLs in a central place or environment variables.
const API_URL = 'http://localhost:3001/api/profile';

function Profile() {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial profile data when the component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setProfile(data);
      } catch (e) {
        console.error('Failed to fetch profile:', e);
        setError('Failed to load profile data. Is the backend server running?');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []); // The empty dependency array ensures this runs only once on mount

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle server-side validation errors or other issues
        throw new Error(data.message || 'An error occurred during the update.');
      }

      // Handle success
      setMessage(data.message);
      setProfile(data.profile);

    } catch (e) {
      console.error('Failed to update profile:', e);
      setError(e.message || 'An unexpected error occurred. Please try again.');
    }
  };

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Edit Profile</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={profile.name}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={profile.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Update Profile</button>
      </form>
    </div>
  );
}

export default Profile;
