import React, { useState, useEffect } from 'react';
import { Bell, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, refreshUser, featureCards, getAlerts, getContacts } from '../App';
import FeatureCard from '../components/FeatureCard';
import '../styles/pages/dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser() || { name: 'User' });
  const [alertsCount, setAlertsCount] = useState(0);
  const [contactsCount, setContactsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await refreshUser();
        const user = getCurrentUser();
        setUser(user || { name: 'User' });

        const alerts = await getAlerts();
        setAlertsCount(alerts.length);

        const contacts = await getContacts();
        setContactsCount(contacts.length);
      } catch (error) {
        console.error('Dashboard load failed', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Listen for auth change
    window.addEventListener('user-auth-change', loadData);
    return () => window.removeEventListener('user-auth-change', loadData);
  }, []);

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="welcome-message">Welcome back, {user.name} 👋</h1>
          <p className="header-subtitle">Your safety is our priority</p>
        </div>
        <button className="notification-btn">
          <Bell size={24} />
          <span className="notification-badge">{alertsCount}</span>
        </button>
      </div>

      {/* Safety Status Card */}
      <div className="safety-status-card">
        <div className="status-icon">
          <Shield size={32} />
        </div>
        <div className="status-content">
          <h3>Safety Status</h3>
          <p className="status-text">Your protection is <span className="status-active">ACTIVE</span></p>
          <div className="status-details">
            <div className="detail">
              <span className="detail-label">Emergency Contacts:</span>
              <span className="detail-value">{contactsCount || 0}</span>
            </div>
            <div className="detail">
              <span className="detail-label">Recent Alerts:</span>
              <span className="detail-value">{alertsCount}</span>
            </div>
          </div>
        </div>
        <div className="status-indicator"></div>
      </div>

      {/* Feature Cards Grid */}
      <div className="features-section">
        <h2 className="section-title">Safety Features</h2>
        <div className="features-grid">
          {featureCards.map((card) => (
            <FeatureCard key={card.id} card={card} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          <button className="quick-action-btn sos" onClick={() => navigate('/sos')}>
            <span className="action-icon">🚨</span>
            <span className="action-text">Emergency SOS</span>
          </button>
          <button className="quick-action-btn location" onClick={() => navigate('/location')}>
            <span className="action-icon">📍</span>
            <span className="action-text">Share Location</span>
          </button>
          <button className="quick-action-btn alert" onClick={() => navigate('/send-alert')}>
            <span className="action-icon">📢</span>
            <span className="action-text">Send Alert</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

