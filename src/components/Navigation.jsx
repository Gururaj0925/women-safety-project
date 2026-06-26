import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MapPin, AlertCircle, MessageSquare, User, Shield } from 'lucide-react';
import '../styles/components/navigation.css';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home, info: 'Dashboard & Overview' },
    { path: '/location', label: 'Location', icon: MapPin, info: 'Live Location Tracking' },
    { path: '/sos', label: 'SOS', icon: AlertCircle, isHighlight: true, info: 'Emergency SOS Alert' },
    { path: '/ai-assistant', label: 'AI Help', icon: MessageSquare, info: 'AI Safety Assistant' },
    { path: '/advanced-safety', label: 'Safety', icon: Shield, info: 'Advanced Safety' },
    { path: '/profile', label: 'Profile', icon: User, info: 'User Settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bottom-navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);

        return (
          <button
            key={item.path}
            className={`nav-item ${item.isHighlight ? 'highlight' : ''} ${active ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            title={item.label}
            data-tooltip={item.info}
          >
            <Icon size={22} />
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;

