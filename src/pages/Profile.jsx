import React, { useState, useEffect } from 'react';
import { LogOut, Bell, Lock, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logoutUser, refreshUser, getAlerts, getContacts } from '../App';
import '../styles/pages/profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [contactsCount, setContactsCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const updatedUser = await refreshUser();
        setUser(updatedUser);

        const [contacts, alerts] = await Promise.all([
          getContacts(),
          getAlerts()
        ]);
        setContactsCount(contacts.length);
        setAlertsCount(alerts.length);
      } catch (error) {
        console.error('Profile load failed', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      {/* User Info */}
      <div className="user-header">
        <div className="user-avatar">{user?.avatar || '👤'}</div>
        <h1 className="user-name">{user?.name || 'User'}</h1>
        <p className="user-email">{user?.email || ''}</p>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="stat-item">
          <span className="stat-number">{contactsCount}</span>
          <span className="stat-label">Emergency Contacts</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{alertsCount}</span>
          <span className="stat-label">Alerts Sent</span>
        </div>
      </div>

      {/* Settings */}
      <div className="settings-section">
        <h2>Settings</h2>
        <div className="settings-list">
          <button className="setting-item">
            <Bell size={20} />
            <span>Notifications</span>
            <span className="arrow">›</span>
          </button>
          <button className="setting-item">
            <Lock size={20} />
            <span>Privacy & Security</span>
            <span className="arrow">›</span>
          </button>
          <button className="setting-item">
            <HelpCircle size={20} />
            <span>Help & Support</span>
            <span className="arrow">›</span>
          </button>
        </div>
      </div>

      {/* Account Info */}
      <div className="account-section">
        <h2>Account Info</h2>
        <div className="account-info">
          <p><strong>Member Since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recent'}</p>
          <p><strong>Status:</strong> <span className="status-active">Active</span></p>
        </div>
      </div>

      {/* Logout */}
      <button className="logout-btn" onClick={handleLogout}>
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default Profile;

