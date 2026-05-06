// src/pages/Dashboard.js - Main dashboard page with dark mode and register meter

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import StatCard from '../components/StatCard';
import AlertTable from '../components/AlertTable';
import ConsumptionChart from '../components/ConsumptionChart';
import NotificationBell from '../components/NotificationBell';
import RegisterMeterModal from '../components/RegisterMeterModal';
import './Dashboard.css';

function Dashboard({ onLogout, darkMode, toggleDarkMode }) {
  const [stats, setStats] = useState({
    activeMeters: 0,
    tamperAlerts: 0,
    revenueLoss: 0,
    responseRate: 0
  });
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [disconnectedMeters, setDisconnectedMeters] = useState([]);
  const [allMeterIds, setAllMeterIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [nextId, setNextId] = useState(1);

  // Zones for dropdown
  const zones = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'];

  // Fixed mock data (original) - Added zone field
  const getFixedMockData = () => {
    const fixedAlerts = [
      { id: 1, meterId: 'MTR_001', address: '123 Main St', zone: 'Zone 1', customer: 'John Smith', imbalance: 45, time: '5 min ago', severity: 'critical', status: 'active', currentPower: 2340, voltage: 223.5, powerFactor: 0.96, todayUsage: 12.5, monthUsage: 345.2, lastSeen: new Date().toLocaleString() },
      { id: 2, meterId: 'MTR_002', address: '456 Oak Ave', zone: 'Zone 1', customer: 'Sarah Johnson', imbalance: 28, time: '12 min ago', severity: 'warning', status: 'active', currentPower: 1850, voltage: 221.2, powerFactor: 0.92, todayUsage: 8.3, monthUsage: 245.7, lastSeen: new Date().toLocaleString() },
      { id: 3, meterId: 'MTR_003', address: '789 Pine Rd', zone: 'Zone 2', customer: 'Michael Brown', imbalance: 15, time: '25 min ago', severity: 'info', status: 'active', currentPower: 1200, voltage: 224.1, powerFactor: 0.94, todayUsage: 5.2, monthUsage: 178.4, lastSeen: new Date().toLocaleString() },
      { id: 4, meterId: 'MTR_004', address: '321 Elm St', zone: 'Zone 2', customer: 'Emily Davis', imbalance: 52, time: '8 min ago', severity: 'critical', status: 'active', currentPower: 3100, voltage: 222.8, powerFactor: 0.88, todayUsage: 15.7, monthUsage: 423.1, lastSeen: new Date().toLocaleString() },
      { id: 5, meterId: 'MTR_005', address: '654 Maple Dr', zone: 'Zone 3', customer: 'David Wilson', imbalance: 8, time: '42 min ago', severity: 'info', status: 'active', currentPower: 890, voltage: 223.9, powerFactor: 0.97, todayUsage: 4.1, monthUsage: 132.5, lastSeen: new Date().toLocaleString() },
      { id: 6, meterId: 'MTR_006', address: '987 Cedar Ln', zone: 'Zone 3', customer: 'Lisa Martinez', imbalance: 35, time: '18 min ago', severity: 'warning', status: 'active', currentPower: 2100, voltage: 221.5, powerFactor: 0.91, todayUsage: 10.2, monthUsage: 298.3, lastSeen: new Date().toLocaleString() },
      { id: 7, meterId: 'MTR_007', address: '147 Birch Way', zone: 'Zone 1', customer: 'Robert Taylor', imbalance: 62, time: '3 min ago', severity: 'critical', status: 'active', currentPower: 3500, voltage: 220.9, powerFactor: 0.85, todayUsage: 18.4, monthUsage: 512.6, lastSeen: new Date().toLocaleString() },
      { id: 8, meterId: 'MTR_008', address: '258 Spruce Ct', zone: 'Zone 2', customer: 'Amanda White', imbalance: 12, time: '55 min ago', severity: 'info', status: 'active', currentPower: 950, voltage: 224.3, powerFactor: 0.95, todayUsage: 3.8, monthUsage: 118.2, lastSeen: new Date().toLocaleString() },
    ];

    const fixedStats = {
      activeMeters: 247,
      tamperAlerts: 8,
      revenueLoss: 4231,
      responseRate: 94
    };

    return { fixedAlerts, fixedStats };
  };

  // Save data to localStorage (both active alerts AND registered meters)
  const saveToLocalStorage = (active, disconnected) => {
    localStorage.setItem('activeAlerts', JSON.stringify(active));
    localStorage.setItem('disconnectedMeters', JSON.stringify(disconnected));
  };

  // Save registered meters separately
  const saveRegisteredMeters = (meters) => {
    localStorage.setItem('registeredMeters', JSON.stringify(meters));
  };

  // Load registered meters from localStorage
  const loadRegisteredMeters = () => {
    const saved = localStorage.getItem('registeredMeters');
    return saved ? JSON.parse(saved) : [];
  };

  // Load data from localStorage
  const loadFromLocalStorage = () => {
    const savedActive = localStorage.getItem('activeAlerts');
    const savedDisconnected = localStorage.getItem('disconnectedMeters');
    
    if (savedActive && savedDisconnected) {
      return {
        activeAlerts: JSON.parse(savedActive),
        disconnectedMeters: JSON.parse(savedDisconnected)
      };
    }
    return null;
  };

  // Update registered meters status based on active/disconnected changes
  const syncRegisteredMeters = () => {
    const registered = loadRegisteredMeters();
    const activeIds = activeAlerts.map(a => a.meterId);
    const disconnectedIds = disconnectedMeters.map(d => d.meterId);
    
    const updatedRegistered = registered.map(meter => {
      if (activeIds.includes(meter.meterId)) {
        return { ...meter, status: 'active' };
      } else if (disconnectedIds.includes(meter.meterId)) {
        return { ...meter, status: 'disconnected' };
      }
      return meter;
    });
    
    saveRegisteredMeters(updatedRegistered);
  };

  // Merge original fixed data with registered meters
  const mergeData = () => {
    const { fixedAlerts, fixedStats } = getFixedMockData();
    
    // Check localStorage first
    const saved = loadFromLocalStorage();
    
    if (saved) {
      // Use saved data
      const allActiveMeterIds = saved.activeAlerts.map(a => a.meterId);
      const allDisconnectedIds = saved.disconnectedMeters.map(d => d.meterId);
      const allIds = [...allActiveMeterIds, ...allDisconnectedIds];
      
      // Calculate next ID
      const numbers = allIds.map(id => parseInt(id.replace('MTR_', ''), 10));
      const maxNumber = Math.max(...numbers, 0);
      setNextId(maxNumber + 1);
      
      setAllMeterIds(allIds);
      
      const updatedStats = {
        ...fixedStats,
        activeMeters: fixedStats.activeMeters + saved.activeAlerts.length - 8,
        tamperAlerts: saved.activeAlerts.length
      };
      
      return { 
        alerts: saved.activeAlerts, 
        disconnected: saved.disconnectedMeters,
        stats: updatedStats, 
        meterIds: allIds 
      };
    }
    
    // Use fresh data
    const meterIds = fixedAlerts.map(a => a.meterId);
    const numbers = meterIds.map(id => parseInt(id.replace('MTR_', ''), 10));
    const maxNumber = Math.max(...numbers);
    setNextId(maxNumber + 1);
    
    setAllMeterIds(meterIds);
    
    return { 
      alerts: fixedAlerts, 
      disconnected: [],
      stats: fixedStats, 
      meterIds 
    };
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    
    setTimeout(() => {
      const { alerts, disconnected, stats, meterIds } = mergeData();
      
      setAllMeterIds(meterIds);
      setStats(stats);
      setActiveAlerts(alerts);
      setDisconnectedMeters(disconnected);
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    }, 500);
  };

  // Handle disconnect meters - UPDATES registeredMeters too
  const handleDisconnectMeters = (meterIdsToDisconnect) => {
    const metersToMove = activeAlerts.filter(alert => meterIdsToDisconnect.includes(alert.id));
    
    const disconnectedWithTimestamp = metersToMove.map(meter => ({
      ...meter,
      status: 'disconnected',
      disconnectedAt: new Date().toLocaleString(),
      severity: 'info',
      time: 'Just now'
    }));
    
    const newActiveAlerts = activeAlerts.filter(alert => !meterIdsToDisconnect.includes(alert.id));
    const newDisconnectedMeters = [...disconnectedMeters, ...disconnectedWithTimestamp];
    
    setActiveAlerts(newActiveAlerts);
    setDisconnectedMeters(newDisconnectedMeters);
    saveToLocalStorage(newActiveAlerts, newDisconnectedMeters);
    
    // Sync registered meters
    const registered = loadRegisteredMeters();
    const updatedRegistered = registered.map(meter => {
      if (meterIdsToDisconnect.includes(meter.meterId)) {
        return { ...meter, status: 'disconnected' };
      }
      return meter;
    });
    saveRegisteredMeters(updatedRegistered);
    
    setStats(prev => ({
      ...prev,
      tamperAlerts: newActiveAlerts.length,
      activeMeters: prev.activeMeters - metersToMove.length
    }));
    
    toast.success(`🔌 ${metersToMove.length} meter(s) disconnected!`);
  };

  // Handle reconnect meters - UPDATES registeredMeters too
  const handleReconnectMeters = (meterIdsToReconnect) => {
    const metersToMove = disconnectedMeters.filter(meter => meterIdsToReconnect.includes(meter.id));
    
    const reconnectedMeters = metersToMove.map(meter => ({
      ...meter,
      status: 'active',
      reconnectedAt: new Date().toLocaleString(),
      time: 'Just now'
    }));
    
    const newDisconnectedMeters = disconnectedMeters.filter(meter => !meterIdsToReconnect.includes(meter.id));
    const newActiveAlerts = [...reconnectedMeters, ...activeAlerts];
    
    newActiveAlerts.sort((a, b) => {
      const numA = parseInt(a.meterId.replace('MTR_', ''), 10);
      const numB = parseInt(b.meterId.replace('MTR_', ''), 10);
      return numA - numB;
    });
    
    setActiveAlerts(newActiveAlerts);
    setDisconnectedMeters(newDisconnectedMeters);
    saveToLocalStorage(newActiveAlerts, newDisconnectedMeters);
    
    // Sync registered meters
    const registered = loadRegisteredMeters();
    const updatedRegistered = registered.map(meter => {
      if (meterIdsToReconnect.includes(meter.meterId)) {
        return { ...meter, status: 'active' };
      }
      return meter;
    });
    saveRegisteredMeters(updatedRegistered);
    
    setStats(prev => ({
      ...prev,
      tamperAlerts: newActiveAlerts.length,
      activeMeters: prev.activeMeters + metersToMove.length
    }));
    
    toast.success(`🔌 ${metersToMove.length} meter(s) reconnected!`);
  };

  // Handle new meter registration - SAVES TO BOTH activeAlerts AND registeredMeters
  const handleRegisterMeter = (newMeter) => {
    // Check if already exists
    const exists = allMeterIds.some(id => id === newMeter.meterId);
    if (exists) {
      toast.error(`❌ Meter ${newMeter.meterId} already exists!`);
      return;
    }
    
    // Create new alert with ALL fields
    const newAlert = {
      id: Date.now(),
      meterId: newMeter.meterId,
      address: newMeter.address,
      zone: newMeter.zone || '',
      customer: newMeter.customerName,
      imbalance: 0,
      time: 'Just now',
      severity: 'info',
      status: 'active',
      currentPower: 0,
      voltage: 0,
      powerFactor: 0,
      todayUsage: 0,
      monthUsage: 0,
      lastSeen: 'Just now'
    };
    
    // Add to active alerts
    const newActiveAlerts = [newAlert, ...activeAlerts];
    newActiveAlerts.sort((a, b) => {
      const numA = parseInt(a.meterId.replace('MTR_', ''), 10);
      const numB = parseInt(b.meterId.replace('MTR_', ''), 10);
      return numA - numB;
    });
    
    setActiveAlerts(newActiveAlerts);
    setAllMeterIds(prev => [...prev, newMeter.meterId]);
    
    // Save to localStorage (activeAlerts)
    saveToLocalStorage(newActiveAlerts, disconnectedMeters);
    
    // ALSO save to registeredMeters for MeterDetail page
    const existingRegistered = loadRegisteredMeters();
    const newRegistered = [...existingRegistered, { ...newMeter, status: 'active' }];
    saveRegisteredMeters(newRegistered);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      activeMeters: prev.activeMeters + 1,
      tamperAlerts: prev.tamperAlerts + 1
    }));
    
    // Update next ID
    const currentNumber = parseInt(newMeter.meterId.replace('MTR_', ''), 10);
    setNextId(prev => Math.max(prev, currentNumber + 1));
    setLastUpdated(new Date().toLocaleTimeString());
    
    toast.success(`✅ Meter ${newMeter.meterId} registered successfully!`);
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
    toast.success('Dashboard refreshed!');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🔌 Utility Power Monitoring Dashboard</h1>
        </div>
        <div className="header-right">
          <button className="register-btn" onClick={() => setShowRegisterModal(true)}>
            📝 Register Meter
          </button>

          <button className="dark-mode-btn" onClick={toggleDarkMode}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <NotificationBell alerts={activeAlerts} />
          <button className="refresh-btn" onClick={handleRefresh}>
            🔄 Refresh
          </button>

          <button className="billing-btn" onClick={() => window.location.href = '/billing'}>
  💰 Billing
</button>

<button className="tariff-btn" onClick={() => window.location.href = '/tariffs'}>
  💰 Tariffs
</button>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {lastUpdated && (
        <div className="last-updated">
          Last updated: {lastUpdated}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Loading dashboard data...</div>
      ) : (
        <>
          <div className="stats-row">
            <StatCard title="Active Meters" value={stats.activeMeters} icon="📊" color="blue" />
            <StatCard title="Tamper Alerts" value={stats.tamperAlerts} icon="🚨" color="red" />
            <StatCard title="Revenue Loss" value={`$${stats.revenueLoss.toLocaleString()}`} icon="💰" color="orange" />
            <StatCard title="Response Rate" value={`${stats.responseRate}%`} icon="⚡" color="green" />
          </div>

          <div className="alerts-section">
            <AlertTable 
              activeAlerts={activeAlerts}
              disconnectedMeters={disconnectedMeters}
              onDisconnect={handleDisconnectMeters}
              onReconnect={handleReconnectMeters}
              onRefresh={handleRefresh}
            />
          </div>

          <div className="charts-row">
            <ConsumptionChart />
            <div className="map-placeholder">
              <h3>📍 Meter Location Map</h3>
              <div className="map-placeholder-content">
                <p>Map view will be displayed here</p>
                <p className="map-note">(Integration with mapping library coming soon)</p>
              </div>
            </div>
          </div>
        </>
      )}

      {showRegisterModal && (
        <RegisterMeterModal
          onClose={() => setShowRegisterModal(false)}
          onRegister={handleRegisterMeter}
          zones={zones}
          existingMeterIds={allMeterIds}
          suggestedId={`MTR_${String(nextId).padStart(3, '0')}`}
        />
      )}
    </div>
  );
}

export default Dashboard;