// src/pages/TariffManagement.js - Tariff Management for Admin

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import './TariffManagement.css';

function TariffManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTariff, setEditingTariff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'flat',
    description: '',
    flatRate: 0.12,
    tiers: [
      { min: 0, max: 100, rate: 0.10 },
      { min: 101, max: 300, rate: 0.15 },
      { min: 301, max: 999999, rate: 0.20 }
    ],
    touRates: [
      { period: 'Off-Peak (10pm-6am)', hours: '22-6', rate: 0.08 },
      { period: 'Shoulder (6am-6pm)', hours: '6-18', rate: 0.12 },
      { period: 'Peak (6pm-10pm)', hours: '18-22', rate: 0.25 }
    ],
    isActive: true
  });

  // Check if coming from Billing page
  const queryParams = new URLSearchParams(location.search);
  const fromBilling = queryParams.get('from') === 'billing';

  // Load tariffs from localStorage
  const loadTariffs = () => {
    const saved = localStorage.getItem('tariffs');
    if (saved) {
      setTariffs(JSON.parse(saved));
    } else {
      // Default tariffs
      const defaultTariffs = [
        {
          id: 'tariff_1',
          name: 'Residential Flat Rate',
          type: 'flat',
          description: 'Standard residential flat rate',
          flatRate: 0.12,
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'tariff_2',
          name: 'Residential Tiered',
          type: 'tiered',
          description: 'Tiered rates for conservation',
          tiers: [
            { min: 0, max: 100, rate: 0.10 },
            { min: 101, max: 300, rate: 0.15 },
            { min: 301, max: 999999, rate: 0.20 }
          ],
          isActive: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'tariff_3',
          name: 'Commercial TOU',
          type: 'tou',
          description: 'Time of Use for commercial',
          touRates: [
            { period: 'Off-Peak (10pm-6am)', hours: '22-6', rate: 0.08 },
            { period: 'Shoulder (6am-6pm)', hours: '6-18', rate: 0.12 },
            { period: 'Peak (6pm-10pm)', hours: '18-22', rate: 0.25 }
          ],
          isActive: false,
          createdAt: new Date().toISOString()
        }
      ];
      setTariffs(defaultTariffs);
      localStorage.setItem('tariffs', JSON.stringify(defaultTariffs));
    }
    setLoading(false);
  };

  // Save tariffs to localStorage
  const saveTariffs = (newTariffs) => {
    localStorage.setItem('tariffs', JSON.stringify(newTariffs));
    setTariffs(newTariffs);
  };

  // Handle back to billing
  const handleBackToBilling = () => {
    navigate('/billing');
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTierChange = (index, field, value) => {
    const newTiers = [...formData.tiers];
    newTiers[index][field] = parseFloat(value);
    setFormData(prev => ({ ...prev, tiers: newTiers }));
  };

  const addTier = () => {
    setFormData(prev => ({
      ...prev,
      tiers: [...prev.tiers, { min: 0, max: 0, rate: 0 }]
    }));
  };

  const removeTier = (index) => {
    const newTiers = formData.tiers.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, tiers: newTiers }));
  };

  const handleTOUChange = (index, field, value) => {
    const newTOURates = [...formData.touRates];
    newTOURates[index][field] = field === 'rate' ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, touRates: newTOURates }));
  };

  // Submit new/edited tariff
  const handleSubmit = () => {
    if (!formData.name) {
      toast.error('Tariff name is required');
      return;
    }

    if (editingTariff) {
      // Update existing
      const updatedTariffs = tariffs.map(t =>
        t.id === editingTariff.id
          ? { ...formData, id: t.id, createdAt: t.createdAt, updatedAt: new Date().toISOString() }
          : t
      );
      saveTariffs(updatedTariffs);
      toast.success(`Tariff "${formData.name}" updated!`);
    } else {
      // Create new
      const newTariff = {
        ...formData,
        id: `tariff_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      saveTariffs([...tariffs, newTariff]);
      toast.success(`Tariff "${formData.name}" created!`);
    }
    resetForm();
  };

  // Edit tariff
  const handleEdit = (tariff) => {
    setEditingTariff(tariff);
    setFormData({
      name: tariff.name,
      type: tariff.type,
      description: tariff.description || '',
      flatRate: tariff.flatRate || 0.12,
      tiers: tariff.tiers || [
        { min: 0, max: 100, rate: 0.10 },
        { min: 101, max: 300, rate: 0.15 },
        { min: 301, max: 999999, rate: 0.20 }
      ],
      touRates: tariff.touRates || [
        { period: 'Off-Peak (10pm-6am)', hours: '22-6', rate: 0.08 },
        { period: 'Shoulder (6am-6pm)', hours: '6-18', rate: 0.12 },
        { period: 'Peak (6pm-10pm)', hours: '18-22', rate: 0.25 }
      ],
      isActive: tariff.isActive
    });
    setShowModal(true);
  };

  // Delete tariff
  const handleDelete = (tariff) => {
    if (window.confirm(`Are you sure you want to delete tariff "${tariff.name}"?`)) {
      const updatedTariffs = tariffs.filter(t => t.id !== tariff.id);
      saveTariffs(updatedTariffs);
      toast.success(`Tariff "${tariff.name}" deleted!`);
    }
  };

  // Activate/Deactivate tariff
  const toggleActive = (tariffId) => {
    const updatedTariffs = tariffs.map(t =>
      t.id === tariffId ? { ...t, isActive: !t.isActive } : t
    );
    saveTariffs(updatedTariffs);
    toast.success(`Tariff status updated!`);
  };

  // Set as active tariff (deactivate others)
  const setAsActive = (tariffId) => {
    const updatedTariffs = tariffs.map(t =>
      t.id === tariffId ? { ...t, isActive: true } : { ...t, isActive: false }
    );
    saveTariffs(updatedTariffs);
    toast.success(`Tariff activated!`);
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingTariff(null);
    setFormData({
      name: '',
      type: 'flat',
      description: '',
      flatRate: 0.12,
      tiers: [
        { min: 0, max: 100, rate: 0.10 },
        { min: 101, max: 300, rate: 0.15 },
        { min: 301, max: 999999, rate: 0.20 }
      ],
      touRates: [
        { period: 'Off-Peak (10pm-6am)', hours: '22-6', rate: 0.08 },
        { period: 'Shoulder (6am-6pm)', hours: '6-18', rate: 0.12 },
        { period: 'Peak (6pm-10pm)', hours: '18-22', rate: 0.25 }
      ],
      isActive: true
    });
  };

  // Get active tariff
  const activeTariff = tariffs.find(t => t.isActive);

  useEffect(() => {
    loadTariffs();
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

  if (loading) {
    return <div className="loading-spinner">Loading tariffs...</div>;
  }

  return (
    <div className="tariff-management">
      <header className="tariff-header">
        <div className="header-left">
          {/* Conditional back buttons */}
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
          <h1>💰 Tariff Management</h1>
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

      {/* Active Tariff Banner */}
      {activeTariff && (
        <div className="active-tariff-banner">
          <div className="banner-icon">⚡</div>
          <div className="banner-content">
            <h3>Active Tariff: {activeTariff.name}</h3>
            <p>{activeTariff.description || 'Currently applied to all billing calculations'}</p>
          </div>
        </div>
      )}

      {/* Add Tariff Button */}
      <div className="tariff-actions">
        <button className="add-tariff-btn" onClick={() => setShowModal(true)}>
          + Create New Tariff
        </button>
      </div>

      {/* Tariff Cards */}
      <div className="tariff-cards">
        {tariffs.map(tariff => (
          <div key={tariff.id} className={`tariff-card ${tariff.isActive ? 'active' : ''}`}>
            <div className="tariff-card-header">
              <div className="tariff-name">
                <h3>{tariff.name}</h3>
                {tariff.isActive && <span className="active-badge">ACTIVE</span>}
              </div>
              <div className="tariff-actions-buttons">
                <button className="edit-btn" onClick={() => handleEdit(tariff)}>✏️ Edit</button>
                {!tariff.isActive && (
                  <button className="activate-btn" onClick={() => setAsActive(tariff.id)}>Activate</button>
                )}
                <button className="delete-btn" onClick={() => handleDelete(tariff)}>🗑️ Delete</button>
              </div>
            </div>
            <div className="tariff-card-body">
              <p className="tariff-description">{tariff.description || 'No description'}</p>
              <div className="tariff-details">
                <span className="tariff-type">
                  Type: {tariff.type === 'flat' ? '💰 Flat Rate' : tariff.type === 'tiered' ? '📊 Tiered/Slab' : '⏰ Time of Use'}
                </span>
                {tariff.type === 'flat' && (
                  <span className="tariff-rate">Rate: ${tariff.flatRate}/kWh</span>
                )}
                <span className="tariff-created">Created: {new Date(tariff.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="tariff-modal-overlay" onClick={() => resetForm()}>
          <div className="tariff-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTariff ? 'Edit Tariff' : 'Create New Tariff'}</h2>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tariff Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Residential Flat Rate" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Optional description" rows="2" />
              </div>
              <div className="form-group">
                <label>Tariff Type</label>
                <select name="type" value={formData.type} onChange={handleChange}>
                  <option value="flat">Flat Rate (single price per kWh)</option>
                  <option value="tiered">Tiered/Slab (different prices by usage block)</option>
                  <option value="tou">Time of Use (different prices by time of day)</option>
                </select>
              </div>

              {formData.type === 'flat' && (
                <div className="form-group">
                  <label>Rate ($/kWh)</label>
                  <input type="number" name="flatRate" value={formData.flatRate} onChange={handleChange} step="0.01" min="0" />
                </div>
              )}

              {formData.type === 'tiered' && (
                <div className="tiers-section">
                  <label>Usage Tiers</label>
                  {formData.tiers.map((tier, index) => (
                    <div key={index} className="tier-row">
                      <input type="number" placeholder="Min (kWh)" value={tier.min} onChange={(e) => handleTierChange(index, 'min', e.target.value)} />
                      <span>-</span>
                      <input type="number" placeholder="Max (kWh)" value={tier.max} onChange={(e) => handleTierChange(index, 'max', e.target.value)} />
                      <input type="number" placeholder="Rate ($/kWh)" value={tier.rate} onChange={(e) => handleTierChange(index, 'rate', e.target.value)} step="0.01" />
                      <button type="button" className="remove-tier" onClick={() => removeTier(index)}>×</button>
                    </div>
                  ))}
                  <button type="button" className="add-tier-btn" onClick={addTier}>+ Add Tier</button>
                </div>
              )}

              {formData.type === 'tou' && (
                <div className="tou-section">
                  <label>Time of Use Rates</label>
                  {formData.touRates.map((tou, index) => (
                    <div key={index} className="tou-row">
                      <input type="text" placeholder="Period Name" value={tou.period} onChange={(e) => handleTOUChange(index, 'period', e.target.value)} />
                      <input type="text" placeholder="Hours (e.g., 22-6)" value={tou.hours} onChange={(e) => handleTOUChange(index, 'hours', e.target.value)} />
                      <input type="number" placeholder="Rate ($/kWh)" value={tou.rate} onChange={(e) => handleTOUChange(index, 'rate', e.target.value)} step="0.01" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={resetForm}>Cancel</button>
              <button className="save-btn" onClick={handleSubmit}>{editingTariff ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TariffManagement;