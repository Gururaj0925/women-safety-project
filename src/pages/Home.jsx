import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { featureCards } from '../App';
import '../styles/pages/home.css';

const Home = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentCardIndex((prev) => (prev + 1) % 6);
    }, 3000); // 3 seconds per flashcard
    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&^()_+\-=[\]{};':"\\|,.<>\/]).{8,}$/;

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordPattern.test(formData.password)) {
      newErrors.password = 'Use 8+ chars with uppercase, lowercase, number & special symbol';
    }

    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirm password is required';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const url = `http://localhost:5000${endpoint}`;
      
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };
        
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.message || 'Authentication failed' });
        return;
      }

      // Save token and user data to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      window.dispatchEvent(new Event('user-auth-change'));
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ general: 'Failed to connect to the server. Please try again.' });
    }
  };

  return (
    <div className="home-container">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-header">
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
            <p>Smart Protection. Anytime, Anywhere.</p>
            <div className="safety-tagline">Your safety, our priority ❤️</div>
          </div>

          {/* Features Section Now Inside Brand Side for Desktop */}
          <div className="features-showcase">
            <h2 className="glow-text">Smart Safety Suite</h2>
            <div className="features-grid single-card-view">
              {featureCards.slice(0, 6).map((feature, index) => {
                const isActive = index === currentCardIndex;
                const isNext = index === (currentCardIndex + 1) % 6;
                
                return (
                  <div 
                    key={feature.id} 
                    className={`feature-showcase-item flashcard ${isActive ? 'active' : isNext ? 'next-in-stack' : 'hidden'}`}
                    style={isActive ? { 
                      borderColor: feature.color,
                      boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 40px ${feature.color}40`
                    } : {}}
                  >
                    <div className="feature-icon-box" style={{ 
                      background: feature.gradient || feature.color
                    }}>
                      <span className="feature-showcase-icon">{feature.icon}</span>
                    </div>
                    <div className="feature-text">
                      <h3 style={{ color: feature.color }}>{feature.title}</h3>
                      <p>{feature.description}</p>
                    </div>
                  </div>
                );
              })}
              <div className="flashcard-dots">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`dot ${i === currentCardIndex ? 'active' : ''}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {errors.general && <div className="error-message">{errors.general}</div>}

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon password-field">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {isLogin && (
              <div className="forgot-password">
                <button type="button" className="forgot-btn">Forgot Password?</button>
              </div>
            )}

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-with-icon">
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                  />
                </div>
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            )}

            <button type="submit" className="auth-submit-btn">
              {isLogin ? 'Login' : 'Register'}
            </button>
          </form>

          <div className="register-cta">
            <span>{isLogin ? "New here?" : "Already have an account?"}</span>
            <button type="button" className="register-btn" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Register' : 'Login'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
