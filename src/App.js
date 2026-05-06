// src/App.js - Main application with global dark mode and toast notifications

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import MeterDetail from './pages/MeterDetail';
import Login from './pages/Login';
import BillingHistory from './pages/BillingHistory';
import TariffManagement from './pages/TariffManagement';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }
    setLoading(false);
  }, []);

  // Save dark mode preference when it changes
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_role');
    setIsLoggedIn(false);
  };

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <BrowserRouter>
      {/* Toast notification container */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4caf50',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#f44336',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route 
          path="/login" 
          element={!isLoggedIn ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/dashboard" 
          element={isLoggedIn ? <Dashboard onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/meter/:meterId" 
          element={isLoggedIn ? <MeterDetail darkMode={darkMode} toggleDarkMode={toggleDarkMode} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/billing" 
          element={isLoggedIn ? <BillingHistory /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/tariffs" 
          element={isLoggedIn ? <TariffManagement /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;