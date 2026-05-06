// src/components/StatCard.js - Reusable statistics card

import React from 'react';
import './StatCard.css';

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-content">
        <h3 className="stat-card-title">{title}</h3>
        <p className="stat-card-value">{value}</p>
      </div>
    </div>
  );
}

export default StatCard;