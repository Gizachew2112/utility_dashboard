// src/components/ConsumptionChart.js - Power consumption line chart

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './ConsumptionChart.css';

function ConsumptionChart() {
  const [data, setData] = useState([]);
  const [timeRange, setTimeRange] = useState('day');
  const [loading, setLoading] = useState(true);

  // Generate mock data based on time range
  useEffect(() => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      let mockData = [];
      
      if (timeRange === 'day') {
        // 24 hours of data
        for (let i = 0; i < 24; i++) {
          const hour = i;
          const consumption = 800 + Math.random() * 1200;
          const theft = Math.random() * 200;
          mockData.push({
            time: `${hour}:00`,
            consumption: Math.round(consumption),
            theft: Math.round(theft),
            expected: Math.round(consumption + theft)
          });
        }
      } else if (timeRange === 'week') {
        // 7 days of data
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        for (let i = 0; i < 7; i++) {
          const consumption = 15000 + Math.random() * 5000;
          const theft = Math.random() * 1000;
          mockData.push({
            time: days[i],
            consumption: Math.round(consumption),
            theft: Math.round(theft),
            expected: Math.round(consumption + theft)
          });
        }
      } else {
        // 12 months of data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (let i = 0; i < 12; i++) {
          const consumption = 400000 + Math.random() * 150000;
          const theft = 20000 + Math.random() * 30000;
          mockData.push({
            time: months[i],
            consumption: Math.round(consumption),
            theft: Math.round(theft),
            expected: Math.round(consumption + theft)
          });
        }
      }
      
      setData(mockData);
      setLoading(false);
    }, 500);
  }, [timeRange]);

  const formatYAxis = (value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value;
  };

  const getChartTitle = () => {
    switch (timeRange) {
      case 'day': return 'Hourly Consumption';
      case 'week': return 'Daily Consumption';
      case 'month': return 'Monthly Consumption';
      default: return 'Consumption Trend';
    }
  };

  const getYAxisLabel = () => {
    switch (timeRange) {
      case 'day': return 'Power (W)';
      case 'week': return 'Energy (kWh)';
      case 'month': return 'Energy (kWh)';
      default: return 'Energy';
    }
  };

  if (loading) {
    return (
      <div className="consumption-chart">
        <div className="chart-header">
          <h3>📈 Power Consumption Trend</h3>
          <div className="chart-controls">
            <button className="active">Loading...</button>
          </div>
        </div>
        <div className="chart-loading">
          <div className="spinner"></div>
          <p>Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="consumption-chart">
      <div className="chart-header">
        <h3>📈 {getChartTitle()}</h3>
        <div className="chart-controls">
          <button 
            className={timeRange === 'day' ? 'active' : ''}
            onClick={() => setTimeRange('day')}
          >
            Day
          </button>
          <button 
            className={timeRange === 'week' ? 'active' : ''}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button 
            className={timeRange === 'month' ? 'active' : ''}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 11 }}
            interval={timeRange === 'day' ? 3 : 0}
          />
          <YAxis 
            tickFormatter={formatYAxis}
            tick={{ fontSize: 11 }}
            label={{ 
              value: getYAxisLabel(), 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 11, fill: '#666' }
            }}
          />
          <Tooltip 
            formatter={(value) => [`${value.toLocaleString()} W`, '']}
            labelFormatter={(label) => `${label}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="consumption" 
            stroke="#2196F3" 
            name="Actual Consumption"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="expected" 
            stroke="#4caf50" 
            name="Expected (without theft)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="chart-note">
        <span className="note-badge">⚠️</span>
        <span className="note-text">Theft detected when Actual falls below Expected</span>
      </div>
    </div>
  );
}

export default ConsumptionChart;