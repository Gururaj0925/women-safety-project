import React, { useCallback, useState } from 'react';
import { Phone, MapPin, AlertCircle, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sendSOS } from '../App';
import '../styles/pages/sos.css';

const SOS = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [sent, setSent] = useState(false);
  const user = JSON.parse(localStorage.getItem("currentUser"));

  const triggerSOS = useCallback((reason = 'Manual SOS Button Pressed', source = 'manual') => {
    if (isActive || sent) {
      return;
    }

    setIsActive(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
       

const location = {
  lat: position.coords.latitude,
  lng: position.coords.longitude,
  reason,
  source,
  message: `
Emergency SOS Triggered

User Name: ${user?.name || "Unknown"}
Email: ${user?.email || "Unknown"}
Reason: ${reason}
Source: ${source}
Location:
https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}
`
};
console.log("LOCATION DATA:", location);

        try {
          await sendSOS(location);
          setSent(true);
        } catch (error) {
          console.error('SOS failed', error);
          window.alert(`SOS failed: ${error.message}`);
        }

        setTimeout(() => {
          setIsActive(false);
          setSent(false);
        }, 3000);
      },
      async (geoError) => {
        window.alert('Location access failed. SOS will be sent without live location.');

        try {
          await sendSOS({ reason, source });
          setSent(true);
        } catch (error) {
          console.error('SOS failed', error);
          window.alert(`SOS failed: ${error.message}`);
        }

        setTimeout(() => {
          setIsActive(false);
          setSent(false);
        }, 3000);
      }
    );
  }, [isActive, sent]);

  return (
    <div className="sos-container">
      <div className="sos-header">
        <h1>Emergency SOS</h1>
        <p>Tap the button below to instantly trigger emergency alert</p>
      </div>

      <div className="sos-instructions">
        <div className="instruction-box">
          <AlertCircle size={20} />
          <div>
            <p>Upon activation:</p>
            <ul>
              <li>Live location shared</li>
              <li>Alerts sent to contacts</li>
              <li>Logged in emergency history</li>
              <li>Stored securely on server</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="sos-button-wrapper">
        {isActive && (
          <div className="alert-pulse">
            <div className="pulse-ring"></div>
            <div className="pulse-ring pulse-ring-2"></div>
            <div className="pulse-ring pulse-ring-3"></div>
          </div>
        )}
        <button
          className={`sos-button ${isActive ? 'active' : ''}`}
          onClick={() => triggerSOS()}
          disabled={sent || isActive}
        >
          <span className="sos-text">{sent ? 'SENT' : 'SOS'}</span>
        </button>
      </div>

      {sent && <div className="alert-notification success">SOS SENT SUCCESSFULLY!</div>}
      {isActive && !sent && <div className="alert-notification">Sending SOS...</div>}

      <div className="sos-quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-container">
          <button className="action-button location-action" onClick={() => navigate('/location')} disabled={isActive}>
            <MapPin size={24} />
            <span>Share Location</span>
          </button>
          <button className="action-button call-action" onClick={() => window.open('tel:100')}>
            <Phone size={24} />
            <span>Call 100</span>
          </button>
          <button className="action-button alert-action" onClick={() => navigate('/send-alert')} disabled={isActive}>
            <Share2 size={24} />
            <span>Send Alert</span>
          </button>
        </div>
      </div>

      <div className="safety-tips">
        <h2>Safety Tips</h2>
        <div className="tips-list">
          <div className="tip">
            <span className="tip-icon">OK</span>
            <p>Stay calm and find safe location</p>
          </div>
          <div className="tip">
            <span className="tip-icon">OK</span>
            <p>Keep phone charged and location ON</p>
          </div>
          <div className="tip">
            <span className="tip-icon">OK</span>
            <p>SOS automatically notifies contacts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOS;
