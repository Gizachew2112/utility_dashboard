// src/pages/Login.js - Login page component

import React, { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simple validation
    if (!username || !password) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    // TODO: Replace with real API call to your backend
    // For now, demo credentials:
    // Username: admin, Password: admin123
    if (username === 'admin' && password === 'admin123') {
      // Store fake token (replace with real JWT from backend)
      localStorage.setItem('jwt_token', 'fake_jwt_token_demo');
      localStorage.setItem('user_role', 'admin');
      onLogin();
    } else {
      setError('Invalid username or password');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🔌</div>
          <h1>Utility Dashboard</h1>
          <p>Power Monitoring & Control System</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>Demo credentials: admin / admin123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;