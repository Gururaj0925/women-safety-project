import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu } from 'lucide-react';
import { featureCards } from '../App';
import '../styles/pages/welcome.css';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        {/* Brand Section */}
        <div className="welcome-brand">
          <div className="logo-wrap">
            <div className="logo-shield">
              <div className="female-icon female-icon-light"></div>
              <div className="female-icon female-icon-dark"></div>
              <div className="ai-chip">
                <Cpu size={16} />
              </div>
            </div>
          </div>
          <h1>AI Powered Women Safety Tracker</h1>
          <div className="safety-tagline">Your safety, our priority ❤️</div>
        </div>

        {/* Features Showcase */}
        <div className="features-showcase">
          <div className="features-grid">
            {featureCards.slice(0, 6).map((feature) => (
              <div key={feature.id} className="feature-showcase-item">
                <div className="feature-icon-box" style={{ backgroundColor: feature.color }}>
                  <span className="feature-showcase-icon">{feature.icon}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="welcome-buttons">
          <button 
            className="btn-register"
            onClick={() => navigate('/register')}
          >
            Create Account
          </button>
          <button 
            className="btn-login"
            onClick={() => navigate('/login')}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
