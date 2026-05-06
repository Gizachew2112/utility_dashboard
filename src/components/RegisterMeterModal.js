// src/components/RegisterMeterModal.js - Register New Meter Modal

import React, { useState, useEffect } from 'react';
import './RegisterMeterModal.css';

function RegisterMeterModal({ onClose, onRegister, zones, existingMeterIds = [], suggestedId = '' }) {
  const [formData, setFormData] = useState({
    meterId: suggestedId,
    customerName: '',
    address: '',
    zone: zones[0] || 'Zone 1',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Update meterId when suggestedId changes (from parent)
  useEffect(() => {
    if (suggestedId) {
      setFormData(prev => ({ ...prev, meterId: suggestedId }));
    }
  }, [suggestedId]);

  // Get today's date for display
  const today = new Date().toLocaleDateString('en-CA');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-uppercase meter ID
    if (name === 'meterId') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Meter ID validation
    if (!formData.meterId.trim()) {
      newErrors.meterId = 'Meter ID is required';
    } else if (!/^MTR_\d{3}$/i.test(formData.meterId)) {
      newErrors.meterId = 'Format: MTR_001, MTR_002, etc. (MTR_ followed by 3 digits)';
    } else {
      // Check if meter ID already exists
      const exists = existingMeterIds.some(
        id => id.toLowerCase() === formData.meterId.toLowerCase()
      );
      if (exists) {
        newErrors.meterId = `Meter ID ${formData.meterId} already exists. Please use a unique ID.`;
      }
    }
    
    // Customer name validation
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    } else if (formData.customerName.length < 2) {
      newErrors.customerName = 'Customer name must be at least 2 characters';
    }
    
    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.length < 5) {
      newErrors.address = 'Please enter a complete address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    
    // Prepare data for API
    const newMeter = {
      meterId: formData.meterId.toUpperCase(),
      customerName: formData.customerName.trim(),
      address: formData.address.trim(),
      zone: formData.zone,
      installationDate: today,
      status: 'active',
      currentPower: 0,
      voltage: 0,
      powerFactor: 0,
      imbalance: 0,
      todayUsage: 0,
      monthUsage: 0,
      lastSeen: 'Not yet connected'
    };
    
    // TODO: Replace with actual API call
    // const response = await api.post('/meters/register', newMeter);
    
    // Simulate API call
    setTimeout(() => {
      onRegister(newMeter);
      setLoading(false);
      onClose();
    }, 500);
  };

  // Generate suggested meter ID based on existing IDs
  const getSuggestedMeterId = () => {
    if (existingMeterIds.length === 0) {
      return 'MTR_001';
    }
    
    // Extract numbers from existing IDs
    const numbers = existingMeterIds
      .map(id => {
        const match = id.match(/MTR_(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);
    
    if (numbers.length === 0) {
      return 'MTR_001';
    }
    
    const nextNumber = Math.max(...numbers) + 1;
    return `MTR_${String(nextNumber).padStart(3, '0')}`;
  };

  const applySuggestedId = () => {
    const suggestedIdValue = getSuggestedMeterId();
    setFormData(prev => ({ ...prev, meterId: suggestedIdValue }));
    if (errors.meterId) {
      setErrors(prev => ({ ...prev, meterId: '' }));
    }
  };

  return (
    <div className="register-modal-overlay" onClick={onClose}>
      <div className="register-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="register-modal-header">
          <h2>📝 Register New Meter</h2>
          <button className="register-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="register-modal-body">
            {/* Meter ID */}
            <div className="register-form-group">
              <label>Meter ID <span className="required">*</span></label>
              <div className="meter-id-input-group">
                <input
                  type="text"
                  name="meterId"
                  value={formData.meterId}
                  onChange={handleChange}
                  placeholder="Example: MTR_001"
                  className={errors.meterId ? 'error' : ''}
                />
                <button 
                  type="button" 
                  className="suggest-id-btn"
                  onClick={applySuggestedId}
                  title="Auto-generate next available ID"
                >
                  💡 Suggest
                </button>
              </div>
              {errors.meterId && <span className="error-message">{errors.meterId}</span>}
              <small>Format: MTR_001, MTR_002, etc. (MTR_ followed by 3 digits). Must be unique.</small>
            </div>

            {/* Customer Name */}
            <div className="register-form-group">
              <label>Customer Name <span className="required">*</span></label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="Full name of the customer"
                className={errors.customerName ? 'error' : ''}
              />
              {errors.customerName && <span className="error-message">{errors.customerName}</span>}
            </div>

            {/* Address */}
            <div className="register-form-group">
              <label>Address <span className="required">*</span></label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address"
                className={errors.address ? 'error' : ''}
              />
              {errors.address && <span className="error-message">{errors.address}</span>}
            </div>

            {/* Zone */}
            <div className="register-form-group">
              <label>Zone/Area</label>
              <select name="zone" value={formData.zone} onChange={handleChange}>
                {zones.map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>

            {/* Auto-filled info */}
            <div className="register-auto-info">
              <div className="auto-info-item">
                <span className="auto-label">Installation Date:</span>
                <span className="auto-value">{today}</span>
              </div>
              <div className="auto-info-item">
                <span className="auto-label">Initial Status:</span>
                <span className="auto-value status-active">Active</span>
              </div>
              <div className="auto-info-item">
                <span className="auto-label">Initial Readings:</span>
                <span className="auto-value">Will be collected after meter connects</span>
              </div>
            </div>
          </div>

          <div className="register-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-register" disabled={loading}>
              {loading ? 'Registering...' : '✓ Register Meter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterMeterModal;