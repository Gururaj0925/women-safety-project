import React, { useState, useEffect } from 'react';
import { Navigation, Phone } from 'lucide-react';
import { getNearbyPoliceStations } from '../App';
import '../styles/pages/policeStations.css';

const getLastKnownLocation = () => {
  const saved = JSON.parse(localStorage.getItem('lastKnownLocation') || 'null');
  if (!saved?.latitude || !saved?.longitude) return null;

  const isFresh = !saved.timestamp || Date.now() - saved.timestamp < 30 * 60 * 1000;
  return isFresh ? saved : null;
};

const PoliceStations = () => {
  const [policeStations, setPoliceStations] = useState([]);
  const [locationStatus, setLocationStatus] = useState('Fetching nearby stations...');

  useEffect(() => {
    const loadStations = async (latitude, longitude, status) => {
      setLocationStatus('Searching real nearby police stations...');
      const stations = await getNearbyPoliceStations(latitude, longitude);
      setPoliceStations(stations);
      setLocationStatus(status);
    };

    const fallbackLocation = getLastKnownLocation();

    if (!navigator.geolocation) {
      if (fallbackLocation) {
        loadStations(
          fallbackLocation.latitude,
          fallbackLocation.longitude,
          'Showing police stations near your last live location.'
        );
      } else {
        setLocationStatus('Geolocation not supported. Showing fallback stations.');
        getNearbyPoliceStations().then(setPoliceStations);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
        };
        localStorage.setItem('lastKnownLocation', JSON.stringify(coords));
        loadStations(
          coords.latitude,
          coords.longitude,
          'Showing police stations near your current live location.'
        );
      },
      () => {
        if (fallbackLocation) {
          loadStations(
            fallbackLocation.latitude,
            fallbackLocation.longitude,
            'Location permission was blocked. Showing stations near your last live location.'
          );
        } else {
          setLocationStatus('Unable to access your location. Showing fallback stations.');
          getNearbyPoliceStations().then(setPoliceStations);
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  return (
    <div className="police-stations-container">
      <div className="header">
        <h1>Nearby Police Stations</h1>
        <p>{locationStatus}</p>
      </div>

      <div className="stations-list">
        {policeStations.map((station) => (
          <div key={station.id} className="station-card">
            <div className="station-header">
              <h3>{station.name}</h3>
              <span className="rating">{station.rating}</span>
            </div>
            <p className="address">{station.address}</p>
            <p className="distance">Distance: {station.distance}</p>
            <p className="phone">Phone: {station.phone}</p>
            <div className="actions">
              <button
                className="btn-call"
                disabled={!station.phone || station.phone === 'Not available'}
                onClick={() => window.open(`tel:${station.phone}`)}
              >
                <Phone size={16} />
                Call
              </button>
              <button className="btn-navigate" onClick={() => window.open(station.directionsUrl, '_blank')}>
                <Navigation size={16} />
                Navigate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PoliceStations;
