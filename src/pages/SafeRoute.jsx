import React, { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { getSafeRoutes } from '../App';
import '../styles/pages/safeRoute.css';

const SafeRoute = () => {
  const [coordinates, setCoordinates] = useState({ latitude: 28.6139, longitude: 77.209 });
  const [locationStatus, setLocationStatus] = useState('Fetching your current location...');
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation not supported. Showing default routes.');
      setRoutes(getSafeRoutes(coordinates.latitude, coordinates.longitude));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoordinates(currentCoords);
        setLocationStatus('Current location detected.');
        setRoutes(getSafeRoutes(currentCoords.latitude, currentCoords.longitude));
      },
      () => {
        setLocationStatus('Unable to access location. Showing default routes.');
        setRoutes(getSafeRoutes(coordinates.latitude, coordinates.longitude));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  }, []);

  const handleNavigation = (link) => {
    window.open(link, '_blank');
  };

  return (
    <div className="safe-route-container">
      <div className="header">
        <h1>Safe Route Navigation</h1>
        <p>{locationStatus}</p>
      </div>

      <div className="route-info">
        {routes.map((route) => (
          <div key={route.id} className="info-card">
            <Navigation size={24} />
            <h3>{route.name}</h3>
            <p className="route-time">{route.duration}</p>
            <p className="route-distance">{route.distance}</p>
            <div className="route-features">
              <span className="feature">{route.description}</span>
            </div>
            <button className="btn-navigate" onClick={() => handleNavigation(route.link)}>
              Start Navigation
            </button>
          </div>
        ))}
      </div>

      <div className="route-map">
        <div className="map-placeholder">
          <p>Map will open in Google Maps when navigation starts</p>
        </div>
      </div>
    </div>
  );
};

export default SafeRoute;
