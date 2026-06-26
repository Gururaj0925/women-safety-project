import React, { useState, useEffect } from 'react';
import { MapPin, Share2 } from 'lucide-react';
import '../styles/pages/liveLocation.css';

const LiveLocation = () => {
  const [isSharing, setIsSharing] = useState(true);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [locationName, setLocationName] = useState('Detecting your current location...');
  const [locationStatus, setLocationStatus] = useState('Fetching live location...');

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      setLocationName('Location unavailable');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const currentCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoordinates(currentCoords);
        localStorage.setItem('lastKnownLocation', JSON.stringify({
          ...currentCoords,
          timestamp: Date.now(),
        }));
        setLocationStatus('Live location fetched successfully.');

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${currentCoords.latitude}&lon=${currentCoords.longitude}`
          );
          const data = await response.json();
          setLocationName(data.address?.city || data.address?.town || data.address?.village || data.display_name || 'Current location');
        } catch (error) {
          setLocationName('Current location');
        }
      },
      () => {
        setLocationStatus('Unable to access location. Please allow location permissions.');
        setLocationName('Location permission denied');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  }, []);

  const mapUrl = coordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.longitude - 0.02},${coordinates.latitude - 0.01},${coordinates.longitude + 0.02},${coordinates.latitude + 0.01}&layer=mapnik&marker=${coordinates.latitude},${coordinates.longitude}`
    : null;

  return (
    <div className="location-container">
      <div className="location-header">
        <h1>Live Location Tracking</h1>
        <p>Share your real-time location with trusted contacts.</p>
      </div>

      <div className="map-container">
        {mapUrl ? (
          <iframe
            title="Live Location Map"
            className="live-map-iframe"
            src={mapUrl}
            loading="lazy"
          ></iframe>
        ) : (
          <div className="map-placeholder">
            <p>{locationStatus}</p>
          </div>
        )}

        {isSharing && (
          <div className="live-badge">
            <span className="pulse-dot"></span>
            <span>LIVE</span>
          </div>
        )}
      </div>

      <div className="location-details">
        <div className="detail-card">
          <h3>Current Location</h3>
          {coordinates ? (
            <>
              <p className="coordinates">{coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}</p>
              <p className="address">{locationName}</p>
            </>
          ) : (
            <p className="address">{locationName}</p>
          )}
        </div>

        <div className="detail-card">
          <h3>Accuracy</h3>
          <p className="accuracy-value">High Precision</p>
          <p className="accuracy-desc">{locationStatus}</p>
        </div>

        <div className="detail-card">
          <h3>Status</h3>
          <p className={`status-value ${isSharing ? 'active' : 'inactive'}`}>
            {isSharing ? 'Sharing' : 'Not Sharing'}
          </p>
          <p className="status-desc">
            {isSharing ? 'Shared with trusted contacts' : 'Start sharing your location'}
          </p>
        </div>
      </div>

      <div className="sharing-status">
        <div className="status-header">
          <h2>Sharing Status</h2>
          <button
            className={`toggle-share ${isSharing ? 'active' : ''}`}
            onClick={() => setIsSharing(!isSharing)}
          >
            <span className="toggle-slider"></span>
          </button>
        </div>
        <div className="shared-with">
          <p className="shared-label">Shared with:</p>
          <div className="contact-avatars">
            <div className="avatar">👩</div>
            <div className="avatar">👯</div>
            <div className="avatar">🧑</div>
          </div>
          <p className="shared-count">3 contacts are tracking your location</p>
        </div>
      </div>

      <div className="share-section">
        <button
          className="share-button"
          onClick={() => setShowShareOptions(!showShareOptions)}
        >
          <Share2 size={20} />
          <span>Share Location</span>
        </button>

        {showShareOptions && (
          <div className="share-options-sheet">
            <h3>Share via</h3>
            <div className="share-options">
              <button className="share-option whatsapp" onClick={() => {
                const message = `Check my location: https://maps.google.com/?q=${coordinates.latitude},${coordinates.longitude}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
              }}>
                <span className="option-icon">💬</span>
                <span>WhatsApp</span>
              </button>
              <button className="share-option sms" onClick={() => {
                const message = `Check my location: https://maps.google.com/?q=${coordinates.latitude},${coordinates.longitude}`;
                window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
              }}>
                <span className="option-icon">📱</span>
                <span>SMS</span>
              </button>
              <button className="share-option copy" onClick={() => {
                const mapUrl = `https://maps.google.com/?q=${coordinates.latitude},${coordinates.longitude}`;
                navigator.clipboard.writeText(mapUrl);
                alert('Location link copied to clipboard!');
              }}>
                <span className="option-icon">🔗</span>
                <span>Copy Link</span>
              </button>
              <button className="share-option email" onClick={() => {
                const mapUrl = `https://maps.google.com/?q=${coordinates.latitude},${coordinates.longitude}`;
                window.open(`mailto:?subject=My Location&body=Check my location: ${mapUrl}`, '_blank');
              }}>
                <span className="option-icon">📧</span>
                <span>Email</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="safety-tips">
        <h2>Location Sharing Tips</h2>
        <div className="tips">
          <div className="tip">
            <span className="tip-number">1</span>
            <p>Only share your location with trusted contacts</p>
          </div>
          <div className="tip">
            <span className="tip-number">2</span>
            <p>Check your location accuracy regularly</p>
          </div>
          <div className="tip">
            <span className="tip-number">3</span>
            <p>Stop sharing when you reach a safe location</p>
          </div>
          <div className="tip">
            <span className="tip-number">4</span>
            <p>Keep your battery charged for continuous tracking</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveLocation;
