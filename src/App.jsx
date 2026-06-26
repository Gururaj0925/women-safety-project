import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './styles/global.css';
import './styles/dark-theme-fix.css';
import Navigation from './components/Navigation';
import { listenForForegroundMessages } from './utils/firebaseMessaging';

// Pages
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SOS from './pages/SOS';
import EmergencyContacts from './pages/EmergencyContacts';
import AIAssistant from './pages/AIAssistant';
import LiveLocation from './pages/LiveLocation';
import SafeRoute from './pages/SafeRoute';
import SendAlert from './pages/SendAlert';
import PoliceStations from './pages/PoliceStations';
import Profile from './pages/Profile';
import AdvancedSafety from './pages/AdvancedSafetyEnhanced';
import Home from './pages/Home';

// --- Utility Functions & Constants (formerly in helpers.js) ---

export const getCurrentUser = () => {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user) => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

export const getRegisteredUsers = () => {
  const users = localStorage.getItem('registeredUsers');
  return users ? JSON.parse(users) : [];
};

export const saveRegisteredUsers = (users) => {
  localStorage.setItem('registeredUsers', JSON.stringify(users));
};

export const getUserByEmail = (email) => {
  const users = getRegisteredUsers();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
};

export const registerUser = (newUser) => {
  const users = getRegisteredUsers();
  if (getUserByEmail(newUser.email)) {
    return false;
  }
  users.push(newUser);
  saveRegisteredUsers(users);
  return true;
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const shareLocation = (platform, latitude, longitude) => {
  const message = `My current location: ${latitude}, ${longitude}`;
  const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
    sms: `sms:?body=${encodeURIComponent(message)}`,
    email: `mailto:?subject=My Location&body=${encodeURIComponent(message)}`,
    copy: mapUrl,
  };

  if (platform === 'copy') {
    navigator.clipboard.writeText(mapUrl);
    alert('Location link copied!');
  } else if (shareLinks[platform]) {
    window.open(shareLinks[platform], '_blank');
  }
};

const toRad = (deg) => deg * (Math.PI / 180);

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getCurrentUserId = () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  return currentUser?.id || currentUser?.email || 'guest';
};

const getLocalAlerts = () => {
  const userId = getCurrentUserId();
  const allAlerts = JSON.parse(localStorage.getItem('recentAlerts') || '[]');
  return allAlerts.filter((alert) => !alert.userId || alert.userId === userId);
};

const saveLocalAlert = (alert) => {
  const alerts = JSON.parse(localStorage.getItem('recentAlerts') || '[]');
  const nextAlert = {
    id: alert.id || `local-${Date.now()}`,
    userId: alert.userId || getCurrentUserId(),
    type: alert.type || 'safety',
    feature: alert.feature || 'Alert',
    message: alert.message || alert.reason || 'Safety alert',
    severity: alert.severity || 'medium',
    source: alert.source || 'manual',
    location: alert.location || {},
    contactsNotified: alert.contactsNotified || [],
    timestamp: alert.timestamp || new Date().toISOString(),
    createdAt: alert.createdAt || new Date().toISOString(),
  };

  localStorage.setItem('recentAlerts', JSON.stringify([nextAlert, ...alerts].slice(0, 50)));
  return nextAlert;
};

const normalizeAlert = (alert, fallbackType = 'safety') => {
  const timestamp = alert.timestamp || alert.createdAt || alert.updatedAt || new Date().toISOString();
  return {
    id: alert._id || alert.id || `${fallbackType}-${timestamp}`,
    userId: alert.userId || getCurrentUserId(),
    type: alert.type || fallbackType,
    feature: alert.feature || (fallbackType === 'sos' ? 'Emergency SOS' : 'Safety Alert'),
    message: alert.message || alert.reason || (fallbackType === 'sos' ? 'Emergency SOS triggered' : 'Safety alert sent'),
    severity: alert.severity || (fallbackType === 'sos' ? 'critical' : 'medium'),
    source: alert.source || 'manual',
    location: alert.location || {},
    contactsNotified: alert.contactsNotified || [],
    timestamp,
    createdAt: timestamp,
  };
};

const getFallbackPoliceStations = (latitude = 28.6139, longitude = 77.209) => {
  const stations = [
    {
      id: 1,
      name: 'Central Police Station',
      phone: '+91 9876543210',
      address: '123 Main Street',
      rating: 4.5,
      coords: { lat: latitude + 0.018, lng: longitude + 0.009 },
    },
    {
      id: 2,
      name: 'East Side Police Station',
      phone: '+91 9876543211',
      address: '456 Oak Avenue',
      rating: 4.2,
      coords: { lat: latitude + 0.008, lng: longitude + 0.02 },
    },
    {
      id: 3,
      name: 'West District Police',
      phone: '+91 9876543212',
      address: '789 Pine Road',
      rating: 4.8,
      coords: { lat: latitude - 0.012, lng: longitude - 0.015 },
    },
  ];

  return stations
    .map((station) => {
      const distanceKm = getDistanceKm(
        latitude,
        longitude,
        station.coords.lat,
        station.coords.lng
      );
      return {
        ...station,
        distance: `${distanceKm.toFixed(1)} km`,
        directionsUrl: `https://www.google.com/maps/dir/${latitude},${longitude}/${station.coords.lat},${station.coords.lng}`,
      };
    })
    .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
};

const getTagValue = (tags, names) => {
  for (const name of names) {
    if (tags?.[name]) return tags[name];
  }
  return '';
};

const formatPoliceAddress = (tags = {}) => {
  const parts = [
    getTagValue(tags, ['addr:housenumber']),
    getTagValue(tags, ['addr:street']),
    getTagValue(tags, ['addr:suburb', 'addr:neighbourhood']),
    getTagValue(tags, ['addr:city', 'addr:town', 'addr:village']),
  ].filter(Boolean);

  return parts.join(', ') || tags.address || 'Address not available';
};

export const getNearbyPoliceStations = async (latitude, longitude) => {
  if (!latitude || !longitude) {
    return getFallbackPoliceStations();
  }

  const radiusMeters = 7000;
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="police"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="police"](around:${radiusMeters},${latitude},${longitude});
      relation["amenity"="police"](around:${radiusMeters},${latitude},${longitude});
    );
    out center tags;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({ data: query }),
    });

    if (!response.ok) {
      throw new Error('Police station lookup failed');
    }

    const data = await response.json();
    const stations = (data.elements || [])
      .map((item) => {
        const lat = item.lat || item.center?.lat;
        const lng = item.lon || item.center?.lon;
        if (!lat || !lng) return null;

        const tags = item.tags || {};
        const distanceKm = getDistanceKm(latitude, longitude, lat, lng);
        return {
          id: `${item.type}-${item.id}`,
          name: tags.name || 'Police Station',
          phone: getTagValue(tags, ['phone', 'contact:phone']) || 'Not available',
          address: formatPoliceAddress(tags),
          rating: 'Nearby',
          coords: { lat, lng },
          distance: `${distanceKm.toFixed(1)} km`,
          directionsUrl: `https://www.google.com/maps/dir/${latitude},${longitude}/${lat},${lng}`,
        };
      })
      .filter(Boolean)
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
      .slice(0, 10);

    return stations.length ? stations : getFallbackPoliceStations(latitude, longitude);
  } catch (error) {
    console.error('Failed to fetch police stations:', error);
    return getFallbackPoliceStations(latitude, longitude);
  }
};

export const getSafeRoutes = (startLat, startLng) => {
  const safeTarget = { lat: startLat + 0.017, lng: startLng + 0.013 };
  const fastTarget = { lat: startLat + 0.011, lng: startLng - 0.018 };
  const safeDistanceKm = getDistanceKm(startLat, startLng, safeTarget.lat, safeTarget.lng);
  const fastDistanceKm = getDistanceKm(startLat, startLng, fastTarget.lat, fastTarget.lng);

  return [
    {
      id: 1,
      name: 'Safest Route',
      duration: '12 mins',
      distance: `${safeDistanceKm.toFixed(1)} km`,
      description: 'More secure route with better lighting and police coverage',
      link: `https://www.google.com/maps/dir/${startLat},${startLng}/${safeTarget.lat},${safeTarget.lng}`,
    },
    {
      id: 2,
      name: 'Fastest Route',
      duration: '8 mins',
      distance: `${fastDistanceKm.toFixed(1)} km`,
      description: 'Fastest route for quicker arrival',
      link: `https://www.google.com/maps/dir/${startLat},${startLng}/${fastTarget.lat},${fastTarget.lng}`,
    },
  ];
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  const lengthValid = password.length >= 8;
  const uppercaseValid = /[A-Z]/.test(password);
  const numberValid = /[0-9]/.test(password);
  const specialCharValid = /[!@#$%^&*(),.?"':{}|<>]/.test(password);
  return lengthValid && uppercaseValid && numberValid && specialCharValid;
};

export const getPasswordValidationErrors = (password) => {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[!@#$%^&*(),.?"':{}|<>]/.test(password),
  };
};

export const emergencyContacts = [
  {
    id: 1,
    name: 'Mom',
    phone: '+91 9876543210',
    role: 'Primary',
    avatar: '👩',
  },
  {
    id: 2,
    name: 'Sister',
    phone: '+91 9876543211',
    role: 'Secondary',
    avatar: '👯',
  },
  {
    id: 3,
    name: 'Police',
    phone: '100',
    role: 'Emergency',
    avatar: '🚔',
  },
  {
    id: 4,
    name: 'Friend',
    phone: '+91 9876543212',
    role: 'Secondary',
    avatar: '👧',
  },
];

export const featureCards = [
  {
    id: 1,
    title: 'SOS Emergency',
    description: 'Instantly alert contacts & authorities with one tap during emergencies',
    icon: '🚨',
    color: '#ff2d55',
    gradient: 'linear-gradient(135deg, #ff2d55, #ff6b81)',
    route: '/sos',
  },
  {
    id: 2,
    title: 'Live Location',
    description: 'Share your real-time GPS location with trusted family & friends',
    icon: '📍',
    color: '#bf5af2',
    gradient: 'linear-gradient(135deg, #bf5af2, #da85ff)',
    route: '/location',
  },
  {
    id: 3,
    title: 'AI Assistant',
    description: 'Get 24/7 intelligent safety guidance powered by advanced AI',
    icon: '🤖',
    color: '#5e5ce6',
    gradient: 'linear-gradient(135deg, #5e5ce6, #8b8aff)',
    route: '/ai-assistant',
  },
  {
    id: 4,
    title: 'Contacts',
    description: 'Manage your emergency contacts for instant one-tap alerts',
    icon: '👥',
    color: '#ff375f',
    gradient: 'linear-gradient(135deg, #ff375f, #ff7096)',
    route: '/contacts',
  },
  {
    id: 5,
    title: 'Safe Route',
    description: 'Navigate through the safest, well-lit routes to your destination',
    icon: '🛣️',
    color: '#30d158',
    gradient: 'linear-gradient(135deg, #30d158, #6ee78e)',
    route: '/safe-route',
  },
  {
    id: 6,
    title: 'Send Alert',
    description: 'Broadcast emergency alerts to your entire trusted network',
    icon: '📢',
    color: '#ff9f0a',
    gradient: 'linear-gradient(135deg, #ff9f0a, #ffbf4d)',
    route: '/send-alert',
  },
  {
    id: 7,
    title: 'Police Stations',
    description: 'Find nearby help',
    icon: '🚔',
    color: '#0a84ff',
    gradient: 'linear-gradient(135deg, #0a84ff, #5ab0ff)',
    route: '/police-stations',

  },
  {
    id: 8,
    title: 'AI Navigation',
    description: 'Get AI-powered smart route guidance to stay safe',
    icon: '🧭',
    color: '#ff6ac1',
    gradient: 'linear-gradient(135deg, #ff6ac1, #ff99d6)',
    route: '/ai-navigation',
  },
  {
    id: 9,
    title: 'Advanced Safety',
    description: 'AI-powered threat detection & prevention system',
    icon: '🛡️',
    color: '#ac8ef8',
    gradient: 'linear-gradient(135deg, #ac8ef8, #c9b5ff)',
    route: '/advanced-safety',
  },
];

export const aiAssistantResponses = {
  greetings: [
    "Hello! I'm here to help you stay safe. What can I do for you?",
    "Hi there! Your safety is my priority. How can I assist?",
    "Welcome! I'm your AI safety companion. What do you need?",
  ],
  unsafe: [
    "I understand you feel unsafe. I'm alerting your emergency contacts and sharing your location.",
    "Your safety is paramount. Emergency services are being notified.",
  ],
  location: [
    "I'm sharing your real-time location with your trusted contacts.",
    "Your location is being shared. Stay safe!",
  ],
};

export const refreshUser = () => {
  return getCurrentUser();
};

export const getAlerts = async () => {
  try {
    const userId = getCurrentUserId();
    const [safetyResponse, sosResponse] = await Promise.allSettled([
      fetch(`http://localhost:5000/api/safety-events?userId=${userId}`),
      fetch(`http://localhost:5000/api/sos/events?userId=${userId}`),
    ]);

    const safetyEvents =
      safetyResponse.status === 'fulfilled' && safetyResponse.value.ok
        ? (await safetyResponse.value.json()).map((item) => normalizeAlert(item, 'safety'))
        : [];
    const sosEvents =
      sosResponse.status === 'fulfilled' && sosResponse.value.ok
        ? (await sosResponse.value.json()).map((item) => normalizeAlert(item, 'sos'))
        : [];

    return [...safetyEvents, ...sosEvents, ...getLocalAlerts().map((item) => normalizeAlert(item, item.type))]
      .filter((alert, index, alerts) => alerts.findIndex((item) => item.id === alert.id) === index)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return getLocalAlerts().map((item) => normalizeAlert(item, item.type));
  }
};

export const sendSOS = async (location = {}) => {
  const payloadLocation = location.location || (location.lat ? { lat: location.lat, lng: location.lng } : {});
  const trustedContacts = getContacts().map((contact) => ({
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    role: contact.role,
    fcmToken: contact.fcmToken || contact.pushToken || '',
  }));

  const payload = {
    userId: getCurrentUserId(),
    location: payloadLocation,
    source: location.source || 'manual',
    reason: location.reason || 'Manual SOS Button Pressed',
    message: location.message || '',
    contacts: trustedContacts,
  };

  try {
    const response = await fetch('http://localhost:5000/api/sos/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.message || 'SOS backend request failed');
    }

    const deliveredContacts = data.contactsNotified || trustedContacts.map((contact) => contact.id);
    saveLocalAlert({
      ...payload,
      id: data.eventId || undefined,
      type: 'sos',
      feature: 'Emergency SOS',
      message: payload.message || payload.reason,
      severity: 'critical',
      contactsNotified: deliveredContacts,
    });

    console.log('SOS sent to backend:', data);
    alert(`SOS sent successfully! Notification delivery attempted for ${deliveredContacts.length} contacts.`);
    return data;
  } catch (error) {
    console.error('Failed to send SOS to backend:', error);
    const localAlert = saveLocalAlert({
      ...payload,
      type: 'sos',
      feature: 'Emergency SOS',
      message: payload.message || payload.reason,
      severity: 'critical',
      contactsNotified: trustedContacts.map((contact) => contact.id),
    });
    alert(`SOS failed: ${error.message}`);
    throw error;
  }
};

export const getContacts = () => {
  const savedContacts = localStorage.getItem('emergencyContacts');
  return savedContacts ? JSON.parse(savedContacts) : emergencyContacts || [];
};

export const logSafetyEvent = async ({ message, feature = 'Custom Alert', severity = 'medium', location = {} }) => {
  const payload = {
    userId: getCurrentUserId(),
    feature,
    message,
    severity,
    location,
  };

  try {
    const response = await fetch('http://localhost:5000/api/safety-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    saveLocalAlert({
      ...payload,
      id: data.event?._id,
      type: 'safety',
      contactsNotified: getContacts().map((contact) => contact.id),
    });
    return data;
  } catch (error) {
    console.error('Failed to log safety event:', error);
    return saveLocalAlert({
      ...payload,
      type: 'safety',
      contactsNotified: getContacts().map((contact) => contact.id),
    });
  }
};

export const logoutUser = () => {
  localStorage.removeItem('currentUser');
  window.dispatchEvent(new Event('user-auth-change'));
};

const AppRoutes = ({ isAuthenticated }) => {
  const location = useLocation();
  const showNavigation = isAuthenticated && !['/', '/login', '/register', '/welcome'].includes(location.pathname);

  return (
    <div className="app" style={{ width: '100%', minHeight: '100vh' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/register"
          element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/sos"
          element={isAuthenticated ? <SOS /> : <Navigate to="/" />}
        />
        <Route
          path="/contacts"
          element={isAuthenticated ? <EmergencyContacts /> : <Navigate to="/" />}
        />
        <Route
          path="/ai-assistant"
          element={isAuthenticated ? <AIAssistant /> : <Navigate to="/" />}
        />
        <Route
          path="/location"
          element={isAuthenticated ? <LiveLocation /> : <Navigate to="/" />}
        />
        <Route
          path="/safe-route"
          element={isAuthenticated ? <SafeRoute /> : <Navigate to="/" />}
        />
        <Route
          path="/send-alert"
          element={isAuthenticated ? <SendAlert /> : <Navigate to="/" />}
        />
        <Route
          path="/police-stations"
          element={isAuthenticated ? <PoliceStations /> : <Navigate to="/" />}
        />
        <Route
          path="/profile"
          element={isAuthenticated ? <Profile /> : <Navigate to="/" />}
        />
        <Route
          path="/advanced-safety"
          element={isAuthenticated ? <AdvancedSafety /> : <Navigate to="/" />}
        />
        <Route path="/ai-navigation" element={isAuthenticated ? <SafeRoute /> : <Navigate to="/" />} />
        <Route path="/welcome" element={<Welcome />} />
      </Routes>
      {showNavigation && <Navigation />}
    </div>
  );
};

// --- App Component ---

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('currentUser');
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem('currentUser');
      setIsAuthenticated(!!user);
    };

    window.addEventListener('user-auth-change', checkAuth);
    return () => {
      window.removeEventListener('user-auth-change', checkAuth);
    };
  }, []);

  useEffect(() => {
    let unsubscribe = null;

    listenForForegroundMessages((payload) => {
      const notification = payload.notification || {};
      alert(`${notification.title || 'Emergency SOS Alert'}\n${notification.body || 'A trusted contact sent an alert.'}`);
    })
      .then((cleanup) => {
        unsubscribe = cleanup;
      })
      .catch((error) => {
        console.warn('Firebase foreground messaging unavailable:', error);
      });

    return () => {
      unsubscribe?.();
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #FFE6F0 0%, #F0E6F0 100%)',
        fontSize: '20px',
        fontWeight: '600',
        color: '#4A3F4A',
        fontFamily: 'Poppins, sans-serif'
      }}>
        🔄 Loading...
      </div>
    );
  }

  return (
    <Router>
      <AppRoutes isAuthenticated={isAuthenticated} />
    </Router>
  );
};

export default App;
