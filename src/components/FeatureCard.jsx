import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/featureCard.css';

const FeatureCard = ({ card }) => {
  const navigate = useNavigate();

  return (
    <div
      className="feature-card"
      style={{ backgroundColor: card.color }}
      onClick={() => navigate(card.route)}
    >
      <div className="card-icon">{card.icon}</div>
      <h3 className="card-title">{card.title}</h3>
      <p className="card-description">{card.description}</p>
      <div className="card-arrow">→</div>
    </div>
  );
};

export default FeatureCard;
