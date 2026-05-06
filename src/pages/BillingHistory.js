// src/pages/BillingHistory.js - Billing history page for Admin

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import toast from 'react-hot-toast';
import InvoicePDF from '../components/InvoicePDF';
import './BillingHistory.css';

function BillingHistory() {
  const navigate = useNavigate();
  const [billingData, setBillingData] = useState([]);
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [meters, setMeters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTariffRate, setActiveTariffRate] = useState(0.12);
  const [lastBillingDate, setLastBillingDate] = useState(null);

  // Get active tariff rate from localStorage
  const getActiveTariffRate = () => {
    const saved = localStorage.getItem('tariffs');
    if (saved) {
      const tariffs = JSON.parse(saved);
      const active = tariffs.find(t => t.isActive);
      if (active) {
        if (active.type === 'flat') {
          return active.flatRate;
        }
        if (active.type === 'tiered' && active.tiers && active.tiers.length > 0) {
          return active.tiers[0].rate;
        }
        if (active.type === 'tou' && active.touRates && active.touRates.length > 0) {
          return active.touRates[0].rate;
        }
      }
    }
    return 0.12;
  };

  // Get all meters
  const getAllMeters = () => {
    const savedActive = localStorage.getItem('activeAlerts');
    const savedDisconnected = localStorage.getItem('disconnectedMeters');
    const savedRegistered = localStorage.getItem('registeredMeters');
    
    const active = savedActive ? JSON.parse(savedActive) : [];
    const disconnected = savedDisconnected ? JSON.parse(savedDisconnected) : [];
    const registered = savedRegistered ? JSON.parse(savedRegistered) : [];
    
    const meterMap = new Map();
    
    [...active, ...disconnected, ...registered].forEach(m => {
      if (!meterMap.has(m.meterId)) {
        meterMap.set(m.meterId, {
          meterId: m.meterId,
          customer: m.customer || m.customerName || 'Unknown',
          address: m.address || 'Unknown',
          zone: m.zone || '',
          status: m.status || 'active'
        });
      }
    });
    
    return Array.from(meterMap.values());
  };

  // Save billing data to localStorage
  const saveBillingData = (data) => {
    localStorage.setItem('billingData', JSON.stringify(data));
  };

  // Save last billing date
  const saveLastBillingDate = () => {
    const now = new Date();
    localStorage.setItem('lastBillingDate', JSON.stringify(now));
    setLastBillingDate(now);
  };

  // Load billing data from localStorage or generate
  const loadBillingData = () => {
    const saved = localStorage.getItem('billingData');
    if (saved) {
      return JSON.parse(saved);
    }
    return generateBillingData();
  };

  // Generate mock billing data with active tariff rate
  const generateBillingData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const allMetersList = getAllMeters();
    const allBills = [];
    const currentRate = getActiveTariffRate();
    
    allMetersList.forEach(meter => {
      for (let i = 0; i < 6; i++) {
        const monthIndex = (new Date().getMonth() - i + 12) % 12;
        const month = months[monthIndex];
        const year = monthIndex > new Date().getMonth() ? currentYear - 1 : currentYear;
        
        const consumption = Math.floor(Math.random() * 500) + 100;
        const rate = currentRate;
        const amount = (consumption * rate).toFixed(2);
        
        let status;
        if (i === 0) status = 'Unpaid';
        else if (i === 1) status = 'Overdue';
        else status = 'Paid';
        
        allBills.push({
          id: `${meter.meterId}_${year}_${month}`,
          meterId: meter.meterId,
          customer: meter.customer,
          address: meter.address,
          zone: meter.zone,
          period: `${month} ${year}`,
          year: year,
          month: month,
          consumption: consumption,
          rate: rate,
          amount: amount,
          status: status,
          paymentDate: status === 'Paid' ? new Date(year, monthIndex, 15).toLocaleDateString() : '',
          dueDate: new Date(year, monthIndex + 1, 5).toLocaleDateString(),
          invoiceNumber: `INV-${meter.meterId}-${year}${String(monthIndex + 1).padStart(2, '0')}`
        });
      }
    });
    
    const monthOrder = { 'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12 };
    allBills.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return monthOrder[b.month] - monthOrder[a.month];
    });
    
    saveBillingData(allBills);
    return allBills;
  };

  // Generate new bills for current month (Auto-Billing)
  const generateNewBills = (existingBills, metersList, month, year, rate) => {
    const newBills = [...existingBills];
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
    
    metersList.forEach(meter => {
      const meterNumber = parseInt(meter.meterId.replace('MTR_', ''), 10);
      const consumption = Math.floor(Math.random() * 500) + 100 + (meterNumber % 10) * 10;
      const amount = (consumption * rate).toFixed(2);
      
      const newBill = {
        id: `${meter.meterId}_${year}_${month}`,
        meterId: meter.meterId,
        customer: meter.customer,
        address: meter.address,
        zone: meter.zone,
        period: `${month} ${year}`,
        year: year,
        month: month,
        consumption: consumption,
        rate: rate,
        amount: amount,
        status: 'Unpaid',
        paymentDate: '',
        dueDate: new Date(year, monthIndex + 1, 15).toLocaleDateString(),
        invoiceNumber: `INV-${meter.meterId}-${year}${String(monthIndex + 1).padStart(2, '0')}`
      };
      
      newBills.push(newBill);
    });
    
    newBills.sort((a, b) => {
      const numA = parseInt(a.meterId.replace('MTR_', ''), 10);
      const numB = parseInt(b.meterId.replace('MTR_', ''), 10);
      return numA - numB;
    });
    
    setBillingData(newBills);
    saveBillingData(newBills);
    saveLastBillingDate();
    toast.success(`✅ Auto-billing completed for ${month} ${year}! Generated ${metersList.length} invoices.`);
  };

  // Auto-billing handler
  const handleAutoBilling = () => {
    if (window.confirm('⚠️ Run auto-billing for the current month?\n\nThis will generate new invoices for all active meters based on their consumption and the active tariff rate.')) {
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentDate = new Date();
      const currentMonth = months[currentDate.getMonth()];
      const currentYear = currentDate.getFullYear();
      const currentRate = getActiveTariffRate();
      
      const allMetersList = getAllMeters();
      
      // Check if bills already exist for this month
      const existingBills = billingData.filter(bill => 
        bill.period === `${currentMonth} ${currentYear}`
      );
      
      if (existingBills.length > 0) {
        if (window.confirm(`Bills for ${currentMonth} ${currentYear} already exist. Overwrite?`)) {
          const filteredBills = billingData.filter(bill => 
            bill.period !== `${currentMonth} ${currentYear}`
          );
          generateNewBills(filteredBills, allMetersList, currentMonth, currentYear, currentRate);
        }
      } else {
        generateNewBills(billingData, allMetersList, currentMonth, currentYear, currentRate);
      }
    }
  };

  // Update bill status
  const updateBillStatus = (billId, newStatus, isPaid = false) => {
    const updatedBills = billingData.map(bill => {
      if (bill.id === billId) {
        if (isPaid) {
          return {
            ...bill,
            status: newStatus,
            paymentDate: new Date().toLocaleDateString(),
            paymentMethod: 'Cash/Bank Transfer'
          };
        }
        return { ...bill, status: newStatus };
      }
      return bill;
    });
    
    setBillingData(updatedBills);
    saveBillingData(updatedBills);
  };

  // Handle Mark as Paid
  const handleMarkAsPaid = (bill) => {
    updateBillStatus(bill.id, 'Paid', true);
    toast.success(`✅ ${bill.meterId} - ${bill.period} marked as paid!`);
  };

  // Handle Mark as Overdue
  const handleMarkAsOverdue = (bill) => {
    updateBillStatus(bill.id, 'Overdue');
    toast.warning(`⚠️ ${bill.meterId} - ${bill.period} marked as overdue!`);
  };

  // Handle Send Reminder
  const handleSendReminder = (bill) => {
    toast.success(`📧 Reminder sent to ${bill.customer} for ${bill.period} bill of $${bill.amount}`);
  };

  // Handle Disconnect Meter
  const handleDisconnectMeter = (bill) => {
    if (window.confirm(`⚠️ Are you sure you want to DISCONNECT meter ${bill.meterId} for non-payment?\n\nCustomer: ${bill.customer}\nAmount Due: $${bill.amount}\n\nThis will cut power to the premises.`)) {
      const savedActive = localStorage.getItem('activeAlerts');
      const activeAlerts = savedActive ? JSON.parse(savedActive) : [];
      const updatedActive = activeAlerts.map(meter => 
        meter.meterId === bill.meterId ? { ...meter, status: 'disconnected' } : meter
      );
      localStorage.setItem('activeAlerts', JSON.stringify(updatedActive));
      
      toast.error(`🔌 Meter ${bill.meterId} disconnected due to non-payment!`);
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  // Load data
  useEffect(() => {
    const metersList = getAllMeters();
    setMeters(metersList);
    setActiveTariffRate(getActiveTariffRate());
    
    const bills = loadBillingData();
    setBillingData(bills);
    
    // Load last billing date
    const savedDate = localStorage.getItem('lastBillingDate');
    if (savedDate) {
      setLastBillingDate(new Date(JSON.parse(savedDate)));
    }
    
    setLoading(false);
    
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

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

  // Filter bills
  const filteredBills = billingData.filter(bill => {
    const matchesMeter = selectedMeter ? bill.meterId === selectedMeter : true;
    const matchesStatus = filterStatus === 'all' || bill.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      bill.meterId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.customer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMeter && matchesStatus && matchesSearch;
  });

  // Calculate outstanding balance
  const outstandingBalance = filteredBills
    .filter(bill => bill.status !== 'Paid')
    .reduce((sum, bill) => sum + parseFloat(bill.amount), 0)
    .toFixed(2);

  // Get status badge class
  const getStatusBadge = (status) => {
    switch(status) {
      case 'Paid': return 'status-paid';
      case 'Unpaid': return 'status-unpaid';
      case 'Overdue': return 'status-overdue';
      default: return '';
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading billing data...</div>;
  }

  return (
    <div className="billing-history">
      <header className="billing-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>💰 Billing Management</h1>
          <button className="auto-billing-btn" onClick={handleAutoBilling}>
            ⚡ Run Auto-Billing
          </button>
          {lastBillingDate && (
            <div className="last-billing-info">
              📅 Last billing: {lastBillingDate.toLocaleDateString()}
            </div>
          )}
        </div>
        <div className="header-right">
          <button className="dark-mode-btn" onClick={toggleDarkMode}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button className="logout-btn" onClick={() => navigate('/login')}>
            Logout
          </button>
        </div>
      </header>

      {/* Active Tariff Info Bar */}
      <div className="active-tariff-info">
        <span className="tariff-icon">⚡</span>
        <span className="tariff-text">Active Tariff Rate: ${activeTariffRate}/kWh</span>
        <button className="manage-tariff-link" onClick={() => navigate('/tariffs?from=billing')}>
          Manage Tariffs →
        </button>
      </div>

      {/* Filters */}
      <div className="billing-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search by Meter ID or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="meter-select">
          <select value={selectedMeter || ''} onChange={(e) => setSelectedMeter(e.target.value || null)}>
            <option value="">All Meters</option>
            {meters.map(meter => (
              <option key={meter.meterId} value={meter.meterId}>
                {meter.meterId} - {meter.customer}
              </option>
            ))}
          </select>
        </div>

        <div className="status-filters">
          <button className={filterStatus === 'all' ? 'active' : ''} onClick={() => setFilterStatus('all')}>
            All ({billingData.length})
          </button>
          <button className={filterStatus === 'Paid' ? 'active' : ''} onClick={() => setFilterStatus('Paid')}>
            Paid ({billingData.filter(b => b.status === 'Paid').length})
          </button>
          <button className={filterStatus === 'Unpaid' ? 'active' : ''} onClick={() => setFilterStatus('Unpaid')}>
            Unpaid ({billingData.filter(b => b.status === 'Unpaid').length})
          </button>
          <button className={filterStatus === 'Overdue' ? 'active' : ''} onClick={() => setFilterStatus('Overdue')}>
            Overdue ({billingData.filter(b => b.status === 'Overdue').length})
          </button>
        </div>
      </div>

      {/* Outstanding Balance Card */}
      {outstandingBalance > 0 && (
        <div className="outstanding-card">
          <div className="outstanding-icon">⚠️</div>
          <div className="outstanding-content">
            <h3>Total Outstanding Balance</h3>
            <p className="outstanding-amount">${outstandingBalance}</p>
            <p className="outstanding-note">Unpaid + Overdue invoices across selected meters</p>
          </div>
        </div>
      )}

      {/* Billing Table */}
      {filteredBills.length === 0 ? (
        <div className="no-bills">
          ✅ No billing records found
        </div>
      ) : (
        <div className="billing-table-wrapper">
          <table className="billing-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Meter ID</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Consumption</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Invoice</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => {
                const invoiceData = {
                  invoiceNumber: bill.invoiceNumber,
                  invoiceDate: new Date(bill.year, new Date().getMonth(), 1).toLocaleDateString(),
                  dueDate: bill.dueDate,
                  period: bill.period,
                  consumption: bill.consumption,
                  rate: `$${bill.rate}`,
                  amount: bill.amount,
                  status: bill.status,
                };
                
                const meterData = {
                  meterId: bill.meterId,
                  zone: bill.zone,
                };
                
                const customerData = {
                  name: bill.customer,
                  address: bill.address,
                };
                
                const isUnpaid = bill.status === 'Unpaid';
                const isOverdue = bill.status === 'Overdue';
                const isPaid = bill.status === 'Paid';
                
                return (
                  <tr key={bill.id} className={isOverdue ? 'overdue-row' : ''}>
                    <td className="period">{bill.period}</td>
                    <td className="meter-link" onClick={() => navigate(`/meter/${bill.meterId}?from=billing`)}>
                      {bill.meterId}
                    </td>
                    <td>{bill.customer}</td>
                    <td>{bill.address}</td>
                    <td>{bill.consumption} kWh</td>
                    <td>${bill.rate}</td>
                    <td className="amount">${bill.amount}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(bill.status)}`}>
                        {bill.status === 'Paid' ? '✅ Paid' : bill.status === 'Unpaid' ? '🟡 Unpaid' : '🔴 Overdue'}
                      </span>
                    </td>
                    <td>{bill.dueDate}</td>
                    <td>
                      <PDFDownloadLink
                        document={<InvoicePDF invoice={invoiceData} meter={meterData} customer={customerData} />}
                        fileName={`${bill.invoiceNumber}.pdf`}
                      >
                        {({ loading }) => loading ? '...' : '📄 PDF'}
                      </PDFDownloadLink>
                    </td>
                    <td className="action-buttons-cell">
                      {!isPaid && (
                        <>
                          <button className="action-btn mark-paid" onClick={() => handleMarkAsPaid(bill)} title="Mark as Paid">✅</button>
                          <button className="action-btn send-reminder" onClick={() => handleSendReminder(bill)} title="Send Reminder">📧</button>
                        </>
                      )}
                      {isUnpaid && !isOverdue && (
                        <button className="action-btn mark-overdue" onClick={() => handleMarkAsOverdue(bill)} title="Mark as Overdue">⏰</button>
                      )}
                      {isOverdue && (
                        <button className="action-btn disconnect" onClick={() => handleDisconnectMeter(bill)} title="Disconnect Meter">⚠️</button>
                      )}
                      <button className="action-btn view-details" onClick={() => navigate(`/meter/${bill.meterId}?from=billing`)} title="View Meter Details">👁️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BillingHistory;