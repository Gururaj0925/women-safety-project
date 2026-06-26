import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Users, MapPin } from 'lucide-react';
import { getAlerts, getContacts, logSafetyEvent, sendSOS } from '../App';
import '../styles/pages/sendAlert.css';

const SendAlert = () => {
  const [message, setMessage] = useState('');
  const [alert, setAlert] = useState('');
  const [alertHistory, setAlertHistory] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  const showAlert = (text) => {
    setAlert(text);
    setTimeout(() => setAlert(''), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const [history, contactList] = await Promise.all([getAlerts(), getContacts()]);
      setAlertHistory(history);
      setContacts(contactList);
    } catch (error) {
      console.error('Failed to load data', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sendEmergencyWithLocation = async (location = {}) => {
    await sendSOS({
      ...location,
      reason: 'Emergency alert sent from Send Alert page',
      source: 'send-alert',
      contactsNotified: contacts.map((contact) => contact.id),
    });
    await loadData();
    showAlert(`Emergency alert sent to ${contacts.length} contacts.`);
  };

  const handleEmergencyAlert = async () => {
    setLoading(true);
    try {
      if (!navigator.geolocation) {
        await sendEmergencyWithLocation();
        return;
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 10000,
        });
      });

      await sendEmergencyWithLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    } catch (error) {
      console.warn('Sending emergency alert without location.', error);
      await sendEmergencyWithLocation();
    } finally {
      setLoading(false);
    }
  };

  const handleCustomMessage = async () => {
    if (!message.trim()) {
      showAlert('Please enter a message.');
      return;
    }

    setLoading(true);
    try {
      await logSafetyEvent({
        message: message.trim(),
        feature: 'Custom Message',
        severity: 'medium',
      });
      setMessage('');
      await loadData();
      showAlert(`Message logged. ${contacts.length} contacts notified.`);
    } catch (error) {
      console.error('Failed to send message', error);
      showAlert('Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  const getHistoryIcon = (item) => {
    if (item.type === 'sos') return <AlertCircle size={20} />;
    if (item.feature?.toLowerCase().includes('location')) return <MapPin size={20} />;
    return <Users size={20} />;
  };

  return (
    <div className="send-alert-container">
      <div className="header">
        <h1>Send Emergency Alert</h1>
        <p>Notify your trusted contacts immediately</p>
      </div>

      {alert && <div className="alert-notification">{alert}</div>}

      <div className="alert-options">
        <div className="alert-card emergency">
          <AlertCircle size={32} />
          <h3>Emergency SOS</h3>
          <button className="btn-send-alert emergency" onClick={handleEmergencyAlert} disabled={loading}>
            {loading ? 'Sending...' : 'Send Emergency Alert'}
          </button>
        </div>

        <div className="alert-card location">
          <MapPin size={32} />
          <h3>Share Location</h3>
          <button className="btn-send-alert location" onClick={handleEmergencyAlert} disabled={loading}>
            Share Location (SOS)
          </button>
        </div>

        <div className="alert-card custom">
          <Users size={32} />
          <h3>Custom Message</h3>
          <input
            type="text"
            placeholder="Enter your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
          />
          <button className="btn-send-alert custom" onClick={handleCustomMessage} disabled={loading}>
            Log Message
          </button>
        </div>
      </div>

      <div className="alert-history">
        <h2>Recent Alerts ({alertHistory.length})</h2>
        <div className="history-list">
          {alertHistory.length === 0 ? (
            <p>No recent alerts sent</p>
          ) : (
            alertHistory.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-icon">{getHistoryIcon(item)}</div>
                <div className="history-content">
                  <p className="history-message">{item.message}</p>
                  <p className="history-meta">
                    {new Date(item.timestamp).toLocaleString()} - {item.contactsNotified?.length || contacts.length || 0} contacts
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SendAlert;
