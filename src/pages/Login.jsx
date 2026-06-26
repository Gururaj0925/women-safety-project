import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { validateEmail, validatePassword, getUserByEmail, setCurrentUser } from '../App';
import '../styles/pages/login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.fromRegister ? 'Registration successful. Please login.' : '');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    const user = getUserByEmail(email);
    if (!user) {
      setError('User not found. Please register first.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be 8+ chars, 1 capital letter, 1 number and 1 special character.');
      return;
    }

    if (user.password !== password) {
      setError('Password is incorrect.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setCurrentUser({ name: user.name, email: user.email, avatar: '👩' });
      window.dispatchEvent(new Event('user-auth-change'));
      setSuccessMessage('Login successful');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-header">
          <div className="shield-logo">
            <div className="shield-icon">
              <span className="female-silhouette">♀</span>
              <span className="ai-chip">⚙️</span>
            </div>
          </div>
          <h1 className="app-title">AI Powered Women Safety Tracker</h1>
          <p className="app-subtitle">Smart Protection. Anytime, Anywhere.</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {successMessage && <div className="success-message">{successMessage}</div>}
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="forgot-password">
            <a href="#forgot">Forgot Password?</a>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <button
            type="button"
            className="register-button"
            onClick={() => navigate('/register')}
            disabled={loading}
          >
            Create Account
          </button>
        </form>

        <div className="login-footer">
          <p>By logging in, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;

