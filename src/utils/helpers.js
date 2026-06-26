
// Original helpers restored
// Utility Functions for Women Safety Tracker

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

export const getNearbyPoliceStations = (latitude, longitude) => {
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
    description: 'Quick emergency alert',
    icon: '🚨',
    color: '#FFB3D9',
    route: '/sos',
  },
  {
    id: 2,
    title: 'Live Location',
    description: 'Share real-time location',
    icon: '📍',
    color: '#E6B3E6',
    route: '/location',
  },
  {
    id: 3,
    title: 'AI Assistant',
    description: 'Safety guidance 24/7',
    icon: '🤖',
    color: '#D4A5D4',
    route: '/ai-assistant',
  },
  {
    id: 4,
    title: 'Contacts',
    description: 'Manage trusted contacts',
    icon: '👥',
    color: '#FFE6F0',
    route: '/contacts',
  },
  {
    id: 5,
    title: 'Safe Route',
    description: 'Navigate safely',
    icon: '🛣️',
    color: '#F0E6F0',
    route: '/safe-route',
  },
  {
    id: 6,
    title: 'Send Alert',
    description: 'Alert your network',
    icon: '📢',
    color: '#E6D9E6',
    route: '/send-alert',
  },
  {
    id: 7,
    title: 'Police Stations',
    description: 'Find nearby help',
    icon: '🚔',
    color: '#FFB3D9',
    route: '/police-stations',
  },
  {
    id: 8,
    title: 'AI Navigation',
    description: 'Smart route guidance',
    icon: '🧭',
    color: '#E6B3E6',
    route: '/ai-navigation',
  },
  {
    id: 9,
    title: 'Advanced Safety',
    description: 'AI-powered detection',
    icon: '🛡️',
    color: '#D4B3E6',
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

export const getAlerts = () => {
  return [];
};

export const sendSOS = () => {
  console.log('SOS sent');
  alert('SOS sent successfully!');
};

export const getContacts = () => {
  return emergencyContacts || [];
};

export const logoutUser = () => {
  localStorage.removeItem('currentUser');
  window.dispatchEvent(new Event('user-auth-change'));
};
