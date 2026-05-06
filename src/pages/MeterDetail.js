// src/pages/MeterDetail.js - Detailed view for a single meter

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';
import './MeterDetail.css';

function MeterDetail({ darkMode, toggleDarkMode }) {
  const { meterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [meter, setMeter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [meterAlerts, setMeterAlerts] = useState([]);
  const [historyRange, setHistoryRange] = useState('week');
  const [historyData, setHistoryData] = useState([]);

  // Check if coming from Billing page
  const queryParams = new URLSearchParams(location.search);
  const fromBilling = queryParams.get('from') === 'billing';

  // Generate mock consumption history for the meter
  const generateHistoryData = (meterId, range) => {
    const data = [];
    
    if (range === 'day') {
      for (let i = 0; i < 24; i++) {
        const hour = i;
        const baseConsumption = (Math.sin(i / 24 * Math.PI * 2) + 1) * 15 + 5;
        const consumption = Math.max(0, baseConsumption + (parseInt(meterId.replace('MTR_', '')) % 10) - 5);
        data.push({
          time: `${hour}:00`,
          consumption: Math.round(consumption * 100) / 100,
          theft: Math.round((Math.random() * 5) * 100) / 100
        });
      }
    } else if (range === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      for (let i = 0; i < 7; i++) {
        const baseConsumption = 120 + Math.random() * 60;
        data.push({
          time: days[i],
          consumption: Math.round(baseConsumption * 100) / 100,
          theft: Math.round((Math.random() * 15) * 100) / 100
        });
      }
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < 12; i++) {
        const baseConsumption = 3500 + Math.random() * 1500;
        data.push({
          time: months[i],
          consumption: Math.round(baseConsumption * 100) / 100,
          theft: Math.round((Math.random() * 500) * 100) / 100
        });
      }
    }
    return data;
  };

  // Update meter status across all storage and refresh the view
  const updateMeterStatus = (meterId, newStatus) => {
    // Get current data
    const savedActive = localStorage.getItem('activeAlerts');
    const savedDisconnected = localStorage.getItem('disconnectedMeters');
    const savedRegistered = localStorage.getItem('registeredMeters');
    
    let activeAlerts = savedActive ? JSON.parse(savedActive) : [];
    let disconnectedMeters = savedDisconnected ? JSON.parse(savedDisconnected) : [];
    let registeredMeters = savedRegistered ? JSON.parse(savedRegistered) : [];
    
    if (newStatus === 'disconnected') {
      // Find meter in active alerts
      const meterToMove = activeAlerts.find(m => m.meterId === meterId);
      if (meterToMove) {
        // Remove from active
        activeAlerts = activeAlerts.filter(m => m.meterId !== meterId);
        // Add to disconnected with updated status
        const disconnectedMeter = { ...meterToMove, status: 'disconnected', time: 'Just now' };
        disconnectedMeters = [disconnectedMeter, ...disconnectedMeters];
      }
    } else if (newStatus === 'active') {
      // Find meter in disconnected
      const meterToMove = disconnectedMeters.find(m => m.meterId === meterId);
      if (meterToMove) {
        // Remove from disconnected
        disconnectedMeters = disconnectedMeters.filter(m => m.meterId !== meterId);
        // Add to active with updated status
        const activeMeter = { ...meterToMove, status: 'active', time: 'Just now' };
        activeAlerts = [activeMeter, ...activeAlerts];
        // Sort by meter ID
        activeAlerts.sort((a, b) => {
          const numA = parseInt(a.meterId.replace('MTR_', ''), 10);
          const numB = parseInt(b.meterId.replace('MTR_', ''), 10);
          return numA - numB;
        });
      }
    }
    
    // Update registered meters status
    registeredMeters = registeredMeters.map(m => 
      m.meterId === meterId ? { ...m, status: newStatus } : m
    );
    
    // Save all back to localStorage
    localStorage.setItem('activeAlerts', JSON.stringify(activeAlerts));
    localStorage.setItem('disconnectedMeters', JSON.stringify(disconnectedMeters));
    localStorage.setItem('registeredMeters', JSON.stringify(registeredMeters));
    
    return { activeAlerts, disconnectedMeters };
  };

  // Get a single meter by ID from current storage
  const getMeterById = (meterId) => {
    const savedActive = localStorage.getItem('activeAlerts');
    const savedDisconnected = localStorage.getItem('disconnectedMeters');
    const savedRegistered = localStorage.getItem('registeredMeters');
    
    const activeAlerts = savedActive ? JSON.parse(savedActive) : [];
    const disconnectedMeters = savedDisconnected ? JSON.parse(savedDisconnected) : [];
    const registeredMeters = savedRegistered ? JSON.parse(savedRegistered) : [];
    
    // First check active alerts
    let found = activeAlerts.find(m => m.meterId === meterId);
    if (found) return { ...found, status: 'active' };
    
    // Then check disconnected
    found = disconnectedMeters.find(m => m.meterId === meterId);
    if (found) return { ...found, status: 'disconnected' };
    
    // Finally check registered meters
    found = registeredMeters.find(m => m.meterId === meterId);
    if (found) return { ...found, status: found.status || 'active' };
    
    return null;
  };

  // Get all registered meters from localStorage (including fixed + registered)
  const getAllMeters = () => {
    const fixedAlerts = [
      { id: 1, meterId: 'MTR_001', address: '123 Main St', zone: 'Zone 1', customer: 'John Smith', imbalance: 45, severity: 'critical', currentPower: 2340, voltage: 223.5, powerFactor: 0.96, todayUsage: 12.5, monthUsage: 345.2, lastSeen: new Date().toLocaleString(), status: 'active' },
      { id: 2, meterId: 'MTR_002', address: '456 Oak Ave', zone: 'Zone 1', customer: 'Sarah Johnson', imbalance: 28, severity: 'warning', currentPower: 1850, voltage: 221.2, powerFactor: 0.92, todayUsage: 8.3, monthUsage: 245.7, lastSeen: new Date().toLocaleString(), status: 'active' },
      { id: 3, meterId: 'MTR_003', address: '789 Pine Rd', zone: 'Zone 2', customer: 'Michael Brown', imbalance: 15, severity: 'info', currentPower: 1200, voltage: 224.1, powerFactor: 0.94, todayUsage: 5.2, monthUsage: 178.4, lastSeen: new Date().toLocaleString(), status: 'active' },
      { id: 4, meterId: 'MTR_004', address: '321 Elm St', zone: 'Zone 2', customer: 'Emily Davis', imbalance: 52, severity: 'critical', currentPower: 3100, voltage: 222.8, powerFactor: 0.88, todayUsage: 15.7, monthUsage: 423.1, lastSeen: new Date().toLocaleString(), status: 'active' },
      { id: 5, meterId: 'MTR_005', address: '654 Maple Dr', zone: 'Zone 3', customer: 'David Wilson', imbalance: 8, severity: 'info', currentPower: 890, voltage: 223.9, powerFactor: 0.97, todayUsage: 4.1, monthUsage: 132.5, lastSeen: new Date().toLocaleString(), status: 'active' },
      { id: 6, meterId: 'MTR_006', address: '987 Cedar Ln', zone: 'Zone 3', customer: 'Lisa Martinez', imbalance: 35, severity: 'warning', currentPower: 2100, voltage: 221.5, powerFactor: 0.91, todayUsage: 10.2, monthUsage: 298.3, lastSeen: new Date().toLocaleString(), status: 'active' },
      { id: 7, meterId: 'MTR_007', address: '147 Birch Way', zone: 'Zone 1', customer: 'Robert Taylor', imbalance: 62, severity: 'critical', currentPower: 3500, voltage: 220.9, powerFactor: 0.85, todayUsage: 18.4, monthUsage: 512.6, lastSeen: new Date().toLocaleString(), status: 'active' },
      { id: 8, meterId: 'MTR_008', address: '258 Spruce Ct', zone: 'Zone 2', customer: 'Amanda White', imbalance: 12, severity: 'info', currentPower: 950, voltage: 224.3, powerFactor: 0.95, todayUsage: 3.8, monthUsage: 118.2, lastSeen: new Date().toLocaleString(), status: 'active' },
    ];

    const saved = localStorage.getItem('registeredMeters');
    const registeredMeters = saved ? JSON.parse(saved) : [];

    const registeredFormatted = registeredMeters.map((meter, index) => ({
      id: fixedAlerts.length + index + 1,
      meterId: meter.meterId,
      address: meter.address,
      zone: meter.zone || '',
      customer: meter.customerName,
      status: meter.status || 'active',
      currentPower: meter.currentPower || 0,
      voltage: meter.voltage || 0,
      powerFactor: meter.powerFactor || 0,
      imbalance: meter.imbalance || 0,
      todayUsage: meter.todayUsage || 0,
      monthUsage: meter.monthUsage || 0,
      lastSeen: meter.lastSeen || 'Just now',
      severity: 'info'
    }));

    // Also include meters from activeAlerts and disconnectedMeters that might not be in registeredMeters
    const savedActive = localStorage.getItem('activeAlerts');
    const savedDisconnected = localStorage.getItem('disconnectedMeters');
    const activeFromStorage = savedActive ? JSON.parse(savedActive) : [];
    const disconnectedFromStorage = savedDisconnected ? JSON.parse(savedDisconnected) : [];
    
    const allFromStorage = [...activeFromStorage, ...disconnectedFromStorage];
    const existingIds = [...fixedAlerts, ...registeredFormatted].map(m => m.meterId);
    
    const additionalMeters = allFromStorage
      .filter(m => !existingIds.includes(m.meterId))
      .map(m => ({ ...m, status: m.status }));
    
    return [...fixedAlerts, ...registeredFormatted, ...additionalMeters];
  };

  // Generate realistic alert history for specific meter
  const getRealisticAlertHistory = (meterData) => {
    const alerts = [];
    const now = new Date();
    const meterNumber = parseInt(meterData.meterId.replace('MTR_', ''), 10);
    
    const formatDate = (date) => {
      return date.toLocaleString();
    };
    
    const addDays = (date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };
    
    const regDate = addDays(now, -30);
    alerts.push({
      id: 1,
      time: formatDate(regDate),
      type: 'info',
      icon: '✅',
      message: 'Meter registered and activated successfully',
      resolution: 'auto'
    });
    
    const commDate = addDays(now, -28);
    alerts.push({
      id: 2,
      time: formatDate(commDate),
      type: 'info',
      icon: '📡',
      message: 'First data transmission received from meter',
      resolution: 'auto'
    });
    
    if (meterData.severity === 'critical') {
      const criticalDate = addDays(now, -18);
      alerts.push({
        id: 3,
        time: formatDate(criticalDate),
        type: 'critical',
        icon: '🚨',
        message: `Critical imbalance detected (${meterData.imbalance}%) - Immediate inspection required`,
        resolution: 'pending'
      });
      
      const criticalDate2 = addDays(now, -10);
      alerts.push({
        id: 4,
        time: formatDate(criticalDate2),
        type: 'critical',
        icon: '🚨',
        message: `High power theft suspected - Consumption dropped 40% below expected`,
        resolution: 'pending'
      });
    } else if (meterData.severity === 'warning') {
      const warningDate = addDays(now, -20);
      alerts.push({
        id: 3,
        time: formatDate(warningDate),
        type: 'warning',
        icon: '⚠️',
        message: `Elevated imbalance detected (${meterData.imbalance}%) - Monitor closely`,
        resolution: 'pending'
      });
    }
    
    if (meterNumber % 3 === 0) {
      const powerDate = addDays(now, -14);
      alerts.push({
        id: 5,
        time: formatDate(powerDate),
        type: 'warning',
        icon: '⚡',
        message: 'Power quality issue detected - Voltage fluctuations recorded',
        resolution: 'investigating'
      });
    }
    
    const reportDate = addDays(now, -7);
    alerts.push({
      id: 7,
      time: formatDate(reportDate),
      type: 'info',
      icon: '📊',
      message: `Monthly consumption report: ${meterData.monthUsage} kWh consumed, ${(meterData.monthUsage * 0.12).toFixed(2)} estimated bill`,
      resolution: 'auto'
    });
    
    if (meterNumber % 5 === 0) {
      const maintDate = addDays(now, -3);
      alerts.push({
        id: 8,
        time: formatDate(maintDate),
        type: 'info',
        icon: '🔧',
        message: 'Scheduled maintenance reminder - Meter calibration due in 30 days',
        resolution: 'scheduled'
      });
    }
    
    alerts.sort((a, b) => new Date(b.time) - new Date(a.time));
    return alerts;
  };

  // Handle disconnect - updates localStorage and refreshes meter data
  const handleDisconnect = () => {
    updateMeterStatus(meter.meterId, 'disconnected');
    const updatedMeter = getMeterById(meter.meterId);
    if (updatedMeter) {
      setMeter(updatedMeter);
      const updatedAlerts = getRealisticAlertHistory(updatedMeter);
      setMeterAlerts(updatedAlerts);
    }
    toast.success(`🔌 Meter ${meter.meterId} disconnected successfully!`);
  };

  // Handle connect - updates localStorage and refreshes meter data
  const handleConnect = () => {
    updateMeterStatus(meter.meterId, 'active');
    const updatedMeter = getMeterById(meter.meterId);
    if (updatedMeter) {
      setMeter(updatedMeter);
      const updatedAlerts = getRealisticAlertHistory(updatedMeter);
      setMeterAlerts(updatedAlerts);
    }
    toast.success(`🔌 Meter ${meter.meterId} connected successfully!`);
  };

  // Handle back to billing
  const handleBackToBilling = () => {
    navigate('/billing');
  };

  useEffect(() => {
    if (meterId) {
      const data = generateHistoryData(meterId, historyRange);
      setHistoryData(data);
    }
  }, [historyRange, meterId]);

  useEffect(() => {
    const foundMeter = getMeterById(meterId);
    
    if (foundMeter) {
      setMeter(foundMeter);
      const alerts = getRealisticAlertHistory(foundMeter);
      setMeterAlerts(alerts);
    } else {
      const allMeters = getAllMeters();
      const found = allMeters.find(m => m.meterId === meterId);
      if (found) {
        setMeter(found);
        setMeterAlerts(getRealisticAlertHistory(found));
      } else {
        setMeter({
          id: 'unknown',
          meterId: meterId,
          address: 'Unknown Address',
          zone: '',
          customer: 'Unknown Customer',
          status: 'unknown',
          currentPower: 0,
          voltage: 0,
          powerFactor: 0,
          imbalance: 0,
          todayUsage: 0,
          monthUsage: 0,
          lastSeen: 'Never',
          severity: 'info'
        });
        setMeterAlerts([]);
      }
    }
    setLoading(false);
  }, [meterId]);

  if (loading) {
    return <div className="loading-spinner">Loading meter details...</div>;
  }

  if (!meter) {
    return (
      <div className="meter-detail">
        <div className="detail-header">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>Meter Not Found</h1>
        </div>
        <div className="tab-content">
          <p>The meter {meterId} could not be found.</p>
        </div>
      </div>
    );
  }

  const isActive = meter.status === 'active';

  return (
    <div className="meter-detail">
            <div className="detail-header">
        <div className="header-left-group">
          {/* Conditional back buttons - Order: Dashboard first, then Billing */}
          {fromBilling ? (
            <>
              <button className="back-btn" onClick={() => navigate('/dashboard')}>
                ← Back to Dashboard
              </button>
              <button className="back-btn" onClick={handleBackToBilling}>
                ← Back to Billing
              </button>
            </>
          ) : (
            <button className="back-btn" onClick={() => navigate('/dashboard')}>
              ← Back to Dashboard
            </button>
          )}
        </div>
        <h1>Meter: {meter.meterId}</h1>
        <div className="header-right">
          <button className="dark-mode-btn" onClick={toggleDarkMode}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <div className={`status-badge ${isActive ? 'active' : 'disconnected'}`}>
            {isActive ? '🟢 Active' : '🔴 Disconnected'}
          </div>
        </div>
      </div>

      <div className="detail-tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
          📊 Overview
        </button>
        <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
          📈 History
        </button>
        <button className={activeTab === 'alerts' ? 'active' : ''} onClick={() => setActiveTab('alerts')}>
          🚨 Alerts
        </button>
        <button className={activeTab === 'control' ? 'active' : ''} onClick={() => setActiveTab('control')}>
          ⚙️ Control
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="tab-content">
          <div className="info-grid">
            <div className="info-card">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> {meter.customer}</p>
              <p><strong>Address:</strong> {meter.address}</p>
              {meter.zone && <p><strong>Zone:</strong> {meter.zone}</p>}
              <p><strong>Meter ID:</strong> {meter.meterId}</p>
              <p><strong>Status:</strong> {meter.status}</p>
            </div>
            <div className="info-card">
              <h3>Current Readings</h3>
              <p><strong>Power:</strong> {meter.currentPower} W</p>
              <p><strong>Voltage:</strong> {meter.voltage} V</p>
              <p><strong>Power Factor:</strong> {meter.powerFactor}</p>
              <p><strong>Imbalance:</strong> <span className={meter.imbalance > 10 ? 'warning' : ''}>{meter.imbalance}%</span></p>
            </div>
            <div className="info-card">
              <h3>Consumption</h3>
              <p><strong>Today:</strong> {meter.todayUsage} kWh</p>
              <p><strong>This Month:</strong> {meter.monthUsage} kWh</p>
              <p><strong>Estimated Bill:</strong> ${(meter.monthUsage * 0.12).toFixed(2)}</p>
              <p><strong>Last Seen:</strong> {meter.lastSeen}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="tab-content">
          <div className="history-chart-container">
            <div className="chart-header">
              <h3>Consumption History - {meter.meterId}</h3>
              <div className="chart-controls">
                <button 
                  className={historyRange === 'day' ? 'active' : ''}
                  onClick={() => setHistoryRange('day')}
                >
                  Day
                </button>
                <button 
                  className={historyRange === 'week' ? 'active' : ''}
                  onClick={() => setHistoryRange('week')}
                >
                  Week
                </button>
                <button 
                  className={historyRange === 'month' ? 'active' : ''}
                  onClick={() => setHistoryRange('month')}
                >
                  Month
                </button>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  label={{ 
                    value: 'Energy (kWh)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fontSize: 11, fill: '#666' }
                  }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} kWh`, '']}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="consumption" 
                  stackId="1"
                  stroke="#2196F3" 
                  fill="#2196F3" 
                  fillOpacity={0.3}
                  name="Consumption"
                />
                <Area 
                  type="monotone" 
                  dataKey="theft" 
                  stackId="2"
                  stroke="#f44336" 
                  fill="#f44336" 
                  fillOpacity={0.3}
                  name="Estimated Theft"
                />
              </AreaChart>
            </ResponsiveContainer>
            
            <div className="chart-note">
              <span className="note-badge">📊</span>
              <span className="note-text">Theft detected when orange area appears (estimated lost energy)</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'control' && (
        <div className="tab-content">
          <div className="control-panel">
            <h3>Meter Control</h3>
            <div className="control-buttons">
              {isActive ? (
                <>
                  <button className="btn-danger" onClick={handleDisconnect}>
                    ⚠️ Disconnect
                  </button>
                  <button className="btn-success disabled" disabled>
                    🔌 Connect
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-danger disabled" disabled>
                    ⚠️ Disconnect
                  </button>
                  <button className="btn-success" onClick={handleConnect}>
                    🔌 Connect
                  </button>
                </>
              )}
            </div>
            <div className="warning-box">
              <p>⚠️ Disconnecting will cut power to the premises immediately.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="tab-content">
          <div className="alerts-history">
            <h3>Alert History - {meter.meterId}</h3>
            {meterAlerts.length === 0 ? (
              <div className="no-alerts-message">
                ✅ No alerts recorded for this meter
              </div>
            ) : (
              meterAlerts.map((alert) => (
                <div key={alert.id} className={`alert-item ${alert.type}`}>
                  <div className="alert-header">
                    <span className="alert-time">{alert.time}</span>
                    <span className={`alert-type ${alert.type}`}>
                      {alert.icon} {alert.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="alert-message">{alert.message}</div>
                  {alert.resolution && alert.resolution !== 'auto' && (
                    <div className="alert-resolution">
                      <span className="resolution-badge">{alert.resolution}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MeterDetail;