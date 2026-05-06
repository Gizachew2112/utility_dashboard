// src/components/NotificationBell.js - Real-time notification bell

import React, { useState, useEffect } from 'react';
import './NotificationBell.css';

function NotificationBell({ alerts }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [lastCount, setLastCount] = useState(0);

  // Check for new alerts
  useEffect(() => {
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    if (criticalCount > lastCount) {
      setHasNew(true);
      // Play notification sound (optional)
      // new Audio('/notification.mp3').play();
    }
    setLastCount(criticalCount);
  }, [alerts]);

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');
  const infoAlerts = alerts.filter(a => a.severity === 'info');

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setHasNew(false);
    }
  };

  return (
    <div className="notification-container">
      <button className="notification-bell" onClick={toggleDropdown}>
        🔔
        {alerts.length > 0 && (
          <span className="notification-badge">{alerts.length}</span>
        )}
        {hasNew && <span className="notification-dot"></span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            <span className="notification-time">Just now</span>
          </div>
          
          {alerts.length === 0 ? (
            <div className="notification-empty">
              ✅ No active alerts
            </div>
          ) : (
            <>
              {criticalAlerts.length > 0 && (
                <div className="notification-group">
                  <div className="group-header critical">🚨 Critical ({criticalAlerts.length})</div>
                  {criticalAlerts.slice(0, 3).map(alert => (
                    <div key={alert.id} className="notification-item critical">
                      <div className="notification-icon">⚠️</div>
                      <div className="notification-content">
                        <div className="notification-title">{alert.meterId}</div>
                        <div className="notification-message">{alert.address} - {alert.imbalance}% imbalance</div>
                      </div>
                    </div>
                  ))}
                  {criticalAlerts.length > 3 && (
                    <div className="notification-more">+{criticalAlerts.length - 3} more critical alerts</div>
                  )}
                </div>
              )}

              {warningAlerts.length > 0 && (
                <div className="notification-group">
                  <div className="group-header warning">⚠️ Warning ({warningAlerts.length})</div>
                  {warningAlerts.slice(0, 2).map(alert => (
                    <div key={alert.id} className="notification-item warning">
                      <div className="notification-icon">⚠️</div>
                      <div className="notification-content">
                        <div className="notification-title">{alert.meterId}</div>
                        <div className="notification-message">{alert.imbalance}% imbalance</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
          <div className="notification-footer">
            <button onClick={() => window.location.href = '/alerts'}>
              View All Alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;