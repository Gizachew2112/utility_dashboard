// src/components/AlertTable.js - Table with tabs for Active and Disconnected

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './AlertTable.css';

function AlertTable({ activeAlerts, disconnectedMeters, onDisconnect, onReconnect, onRefresh }) {
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState([]);

  // Get current data based on active tab
  const currentData = activeTab === 'active' ? activeAlerts : disconnectedMeters;

  // Parse time string to Date object for filtering
  const parseTimeToDate = (timeStr) => {
    if (timeStr === 'Just now') return new Date();
    const minutes = parseInt(timeStr);
    if (!isNaN(minutes)) {
      const date = new Date();
      date.setMinutes(date.getMinutes() - minutes);
      return date;
    }
    return new Date();
  };

  // Filter alerts based on search, severity, and date range
  const filteredAlerts = currentData.filter(alert => {
    const matchesSearch = alert.meterId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          alert.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    
    let matchesDateRange = true;
    if (startDate || endDate) {
      const alertDate = parseTimeToDate(alert.time);
      if (startDate && alertDate < startDate) matchesDateRange = false;
      if (endDate && alertDate > endDate) matchesDateRange = false;
    }
    
    return matchesSearch && matchesSeverity && matchesDateRange;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAlerts.length / rowsPerPage);
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Handle row selection
  const handleSelectRow = (alertId) => {
    setSelectedRows(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === paginatedAlerts.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedAlerts.map(alert => alert.id));
    }
  };

  // Bulk action handler
  const handleBulkAction = () => {
    if (selectedRows.length === 0) {
      toast.error('No items selected');
      return;
    }
    
    if (activeTab === 'active') {
      onDisconnect(selectedRows);
    } else {
      onReconnect(selectedRows);
    }
    setSelectedRows([]);
  };

  // Export to PDF
  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    const tableRows = filteredAlerts.map(alert => `
      <tr>
        <td>${alert.severity.toUpperCase()}</td>
        <td>${alert.meterId}</td>
        <td>${alert.address}</td>
        <td>${alert.imbalance}%</td>
        <td>${alert.time}</td>
      </tr>
    `).join('');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${activeTab === 'active' ? 'Active Alerts' : 'Disconnected Meters'} Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #1a237e; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #1a237e; color: white; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <h1>🔌 ${activeTab === 'active' ? 'Active Tamper Alerts' : 'Disconnected Meters'}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total: ${filteredAlerts.length}</p>
          <td>
            <thead>
              <tr><th>Status</th><th>Meter ID</th><th>Address</th><th>Imbalance</th><th>Time</th></tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div class="footer">Utility Power Monitoring System</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    toast.success('PDF report generated!');
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Meter ID', 'Address', 'Imbalance (%)', 'Time', 'Severity'];
    const rows = filteredAlerts.map(alert => [
      alert.meterId, alert.address, alert.imbalance, alert.time, alert.severity.toUpperCase()
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_alerts_${new Date().toISOString().slice(0, 19)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  const getSeverityBadge = (severity) => {
    if (severity === 'critical') {
      return <span className="badge badge-critical">CRITICAL</span>;
    } else if (severity === 'warning') {
      return <span className="badge badge-warning">WARNING</span>;
    } else {
      return <span className="badge badge-info">INFO</span>;
    }
  };

  const handleViewDetails = (meterId) => {
    // No ?from parameter - this comes from Alert Table
    window.location.href = `/meter/${meterId}`;
  };

  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <>
      {/* Tabs */}
      <div className="alert-tabs">
        <button 
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('active');
            setSelectedRows([]);
            setCurrentPage(1);
          }}
        >
          🟡 Active Alerts ({activeAlerts.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'disconnected' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('disconnected');
            setSelectedRows([]);
            setCurrentPage(1);
          }}
        >
          🔴 Disconnected Meters ({disconnectedMeters.length})
        </button>
      </div>

      {/* Filters */}
      <div className="alert-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search by Meter ID or Address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-buttons">
          <button 
            className={severityFilter === 'all' ? 'filter-active' : ''}
            onClick={() => setSeverityFilter('all')}
          >
            All ({currentData.length})
          </button>
          <button 
            className={severityFilter === 'critical' ? 'filter-active' : ''}
            onClick={() => setSeverityFilter('critical')}
          >
            Critical ({currentData.filter(a => a.severity === 'critical').length})
          </button>
          <button 
            className={severityFilter === 'warning' ? 'filter-active' : ''}
            onClick={() => setSeverityFilter('warning')}
          >
            Warning ({currentData.filter(a => a.severity === 'warning').length})
          </button>
        </div>

        <div className="date-range-picker">
          <DatePicker
            placeholderText="Start Date"
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            isClearable
          />
          <span>—</span>
          <DatePicker
            placeholderText="End Date"
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            isClearable
          />
          {(startDate || endDate) && (
            <button className="clear-date-btn" onClick={clearDateFilters}>Clear</button>
          )}
        </div>

        <div className="action-buttons-group">
          <button className="export-pdf-btn" onClick={exportToPDF}>
            📄 Export PDF
          </button>
          <button className="export-csv-btn" onClick={exportToCSV}>
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <div className="bulk-actions-bar">
          <span>{selectedRows.length} meter(s) selected</span>
          <button className="bulk-action-btn" onClick={handleBulkAction}>
            {activeTab === 'active' ? '🔌 Disconnect Selected' : '🔌 Connect Selected'}
          </button>
        </div>
      )}

      {filteredAlerts.length === 0 ? (
        <div className="no-alerts">
          ✅ No {activeTab === 'active' ? 'active alerts' : 'disconnected meters'} found
        </div>
      ) : (
        <>
          <div className="alert-table-wrapper">
            <table className="alert-table">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === paginatedAlerts.length && paginatedAlerts.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Status</th>
                  <th>Meter ID</th>
                  <th>Address</th>
                  <th>Imbalance</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAlerts.map((alert) => (
                  <tr key={alert.id} className={`alert-row ${alert.severity}`}>
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(alert.id)}
                        onChange={() => handleSelectRow(alert.id)}
                      />
                    </td>
                    <td>{getSeverityBadge(alert.severity)}</td>
                    <td className="meter-id">{alert.meterId}</td>
                    <td>{alert.address}</td>
                    <td className="imbalance">{alert.imbalance}%</td>
                    <td>{alert.time}</td>
                    <td className="action-buttons">
                      <button 
                        className="view-details-btn"
                        onClick={() => handleViewDetails(alert.meterId)}
                      >
                        📄 View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination-container">
            <div className="rows-per-page">
              <span>Show:</span>
              <select value={rowsPerPage} onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>rows</span>
            </div>
            <div className="pagination-controls">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>‹</button>
              <span className="page-info">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>›</button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default AlertTable;