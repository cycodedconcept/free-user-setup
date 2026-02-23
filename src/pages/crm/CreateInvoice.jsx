import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faEye, faShare, faEnvelope, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { createInvoice, resetStatus } from '../../slice/invoiceSlice';
import Swal from 'sweetalert2';

const CreateInvoice = ({ onBack }) => {
  const dispatch = useDispatch();
  let token = localStorage.getItem("token");
  let getId = localStorage.getItem("itemId");
  const { loading, error, success } = useSelector((state) => state.invoice);

  const [formData, setFormData] = useState({
    issue_date: '',
    due_date: '',
    currency: 'NGN',
    tax_rate: 0,
    discount_amount: 0,
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const [items, setItems] = useState([
    {
      item_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_percentage: 0
    }
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [name]: name === 'quantity' || name === 'unit_price' || name === 'discount_percentage' 
        ? parseFloat(value) || 0 
        : value
    };
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, {
      item_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_percentage: 0
    }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.unit_price;
    const discount = (subtotal * (item.discount_percentage || 0)) / 100;
    return subtotal - discount;
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = (subtotal * formData.tax_rate) / 100;
    return subtotal + tax - formData.discount_amount;
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validations
    if (!formData.issue_date) {
      newErrors.issue_date = 'Issue date is required';
    }
    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    }
    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
    }

    // Validate items
    const itemErrors = [];
    items.forEach((item, index) => {
      const itemError = {};
      if (!item.item_name.trim()) {
        itemError.item_name = 'Item name is required';
      }
      if (item.quantity < 1) {
        itemError.quantity = 'Quantity must be at least 1';
      }
      if (item.unit_price <= 0) {
        itemError.unit_price = 'Unit price must be greater than 0';
      }
      if (Object.keys(itemError).length > 0) {
        itemErrors[index] = itemError;
      }
    });

    if (itemErrors.length > 0) {
      newErrors.items = itemErrors;
    }

    // Date validation
    if (formData.issue_date && formData.due_date) {
      if (new Date(formData.due_date) < new Date(formData.issue_date)) {
        newErrors.due_date = 'Due date cannot be before issue date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all required fields correctly',
      });
      return;
    }

    dispatch(createInvoice({
      token,
      store_id: getId || '7',
      issue_date: formData.issue_date,
      due_date: formData.due_date,
      currency: formData.currency,
      items: items,
      tax_rate: parseFloat(formData.tax_rate) || 0,
      discount_amount: parseFloat(formData.discount_amount) || 0,
      notes: formData.notes || ''
    }));
  };

  useEffect(() => {
    if (success) {
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Invoice created successfully',
      });
      // Reset form
      setFormData({
        issue_date: '',
        due_date: '',
        currency: 'NGN',
        tax_rate: 0,
        discount_amount: 0,
        notes: ''
      });
      setErrors({});
      setItems([{
        item_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        discount_percentage: 0
      }]);
    }
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.message || 'Failed to create invoice',
      });
    }
    if (success || error) {
      dispatch(resetStatus());
    }
  }, [success, error, dispatch]);

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none'
  };

  const labelStyle = {
    fontSize: '13px',
    color: '#374151',
    marginBottom: '6px',
    display: 'block'
  };

  const errorStyle = {
    fontSize: '12px',
    color: '#DC2626',
    marginTop: '4px'
  };

  const getInputStyle = (fieldName) => ({
    ...inputStyle,
    border: errors[fieldName] ? '1px solid #DC2626' : '1px solid #E5E7EB'
  });

  return (
    <>
      <div className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-3">
            {onBack && (
              <button 
                type="button"
                onClick={onBack} 
                className="btn"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  backgroundColor: '#fff'
                }}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            )}
            <div>
              <p className="bx mb-0">Create New Invoice</p>
              <small className="d-block" style={{color: '#78716C'}}>Fill in the details to create a new invoice</small>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn"
              style={{padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff'}}
            >
              <FontAwesomeIcon icon={faEye} className="me-2" />Preview
            </button>
            <button
              type="button"
              className="btn"
              style={{padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff'}}
            >
              <FontAwesomeIcon icon={faShare} className="me-2" />Share
            </button>
            <button
              type="button"
              className="btn"
              style={{padding: '8px 16px', backgroundColor: '#0273F9', color: '#fff', borderRadius: '8px', fontSize: '13px'}}
            >
              <FontAwesomeIcon icon={faEnvelope} className="me-2" />Send Invoice to Email
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          {/* Invoice Details */}
          <div className="bg-white rounded-3 p-4 mb-4" style={{border: '1px solid #eee'}}>
            <h6 className="mb-3" style={{fontSize: '15px'}}>Invoice Details</h6>
            
            <div className="row">
              <div className="col-md-4 mb-3">
                <label style={labelStyle}>Issue Date <span style={{color: '#DC2626'}}>*</span></label>
                <input
                  type="date"
                  name="issue_date"
                  value={formData.issue_date}
                  onChange={handleChange}
                  style={getInputStyle('issue_date')}
                />
                {errors.issue_date && <small style={errorStyle}>{errors.issue_date}</small>}
              </div>
              <div className="col-md-4 mb-3">
                <label style={labelStyle}>Due Date <span style={{color: '#DC2626'}}>*</span></label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  style={getInputStyle('due_date')}
                />
                {errors.due_date && <small style={errorStyle}>{errors.due_date}</small>}
              </div>
              <div className="col-md-4 mb-3">
                <label style={labelStyle}>Currency <span style={{color: '#DC2626'}}>*</span></label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  style={getInputStyle('currency')}
                >
                  <option value="NGN">NGN - Nigerian Naira</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
                {errors.currency && <small style={errorStyle}>{errors.currency}</small>}
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-white rounded-3 p-4 mb-4" style={{border: '1px solid #eee'}}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 style={{fontSize: '15px', margin: 0}}>Invoice Items</h6>
              <button
                type="button"
                onClick={addItem}
                className="btn btn-sm"
                style={{backgroundColor: '#0273F9', color: '#fff', fontSize: '13px'}}
              >
                <FontAwesomeIcon icon={faPlus} className="me-1" /> Add Item
              </button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="p-3 mb-3 rounded-3" style={{backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB'}}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small style={{fontWeight: '600', color: '#374151'}}>Item {index + 1}</small>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="btn btn-sm"
                      style={{color: '#DC2626', fontSize: '12px'}}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </div>

                <div className="row">
                  <div className="col-md-6 mb-2">
                    <label style={labelStyle}>Item Name <span style={{color: '#DC2626'}}>*</span></label>
                    <input
                      type="text"
                      name="item_name"
                      value={item.item_name}
                      onChange={(e) => handleItemChange(index, e)}
                      placeholder="Enter item name"
                      style={{...inputStyle, border: errors.items?.[index]?.item_name ? '1px solid #DC2626' : '1px solid #E5E7EB'}}
                    />
                    {errors.items?.[index]?.item_name && <small style={errorStyle}>{errors.items[index].item_name}</small>}
                  </div>
                  <div className="col-md-6 mb-2">
                    <label style={labelStyle}>Description</label>
                    <input
                      type="text"
                      name="description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, e)}
                      placeholder="Enter description (optional)"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-3 mb-2">
                    <label style={labelStyle}>Quantity <span style={{color: '#DC2626'}}>*</span></label>
                    <input
                      type="number"
                      name="quantity"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, e)}
                      min="1"
                      style={{...inputStyle, border: errors.items?.[index]?.quantity ? '1px solid #DC2626' : '1px solid #E5E7EB'}}
                    />
                    {errors.items?.[index]?.quantity && <small style={errorStyle}>{errors.items[index].quantity}</small>}
                  </div>
                  <div className="col-md-3 mb-2">
                    <label style={labelStyle}>Unit Price <span style={{color: '#DC2626'}}>*</span></label>
                    <input
                      type="number"
                      name="unit_price"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, e)}
                      min="0"
                      step="0.01"
                      style={{...inputStyle, border: errors.items?.[index]?.unit_price ? '1px solid #DC2626' : '1px solid #E5E7EB'}}
                    />
                    {errors.items?.[index]?.unit_price && <small style={errorStyle}>{errors.items[index].unit_price}</small>}
                  </div>
                  <div className="col-md-3 mb-2">
                    <label style={labelStyle}>Discount (%)</label>
                    <input
                      type="number"
                      name="discount_percentage"
                      value={item.discount_percentage}
                      onChange={(e) => handleItemChange(index, e)}
                      min="0"
                      max="100"
                      style={inputStyle}
                    />
                  </div>
                  <div className="col-md-3 mb-2">
                    <label style={labelStyle}>Item Total</label>
                    <div style={{...inputStyle, backgroundColor: '#F3F4F6', color: '#374151'}}>
                      {formData.currency} {calculateItemTotal(item).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tax, Discount & Notes */}
          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="bg-white rounded-3 p-4 h-100" style={{border: '1px solid #eee'}}>
                <h6 className="mb-3" style={{fontSize: '15px'}}>Additional Info <span style={{fontSize: '12px', color: '#9CA3AF', fontWeight: 'normal'}}>(Optional)</span></h6>
                
                <div className="mb-3">
                  <label style={labelStyle}>Tax Rate (%)</label>
                  <input
                    type="number"
                    name="tax_rate"
                    value={formData.tax_rate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    placeholder="0"
                    style={inputStyle}
                  />
                </div>

                <div className="mb-3">
                  <label style={labelStyle}>Discount Amount</label>
                  <input
                    type="number"
                    name="discount_amount"
                    value={formData.discount_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Payment via bank transfer.&#10;Account Number: 1234567890&#10;Bank: First Bank"
                    rows="4"
                    style={{...inputStyle, resize: 'none'}}
                  />
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="bg-white rounded-3 p-4 h-100" style={{border: '1px solid #eee'}}>
                <h6 className="mb-3" style={{fontSize: '15px'}}>Invoice Summary</h6>
                
                <div className="d-flex justify-content-between mb-2">
                  <span style={{fontSize: '14px', color: '#6B7280'}}>Subtotal</span>
                  <span style={{fontSize: '14px'}}>{formData.currency} {calculateSubtotal().toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span style={{fontSize: '14px', color: '#6B7280'}}>Tax ({formData.tax_rate}%)</span>
                  <span style={{fontSize: '14px'}}>{formData.currency} {((calculateSubtotal() * formData.tax_rate) / 100).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span style={{fontSize: '14px', color: '#6B7280'}}>Discount</span>
                  <span style={{fontSize: '14px', color: '#DC2626'}}>- {formData.currency} {parseFloat(formData.discount_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>

                <hr />

                <div className="d-flex justify-content-between">
                  <span style={{fontSize: '16px', fontWeight: '600'}}>Total</span>
                  <span style={{fontSize: '16px', fontWeight: '600', color: '#0273F9'}}>{formData.currency} {calculateTotal().toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn"
              style={{padding: '10px 24px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px'}}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              style={{padding: '10px 24px', backgroundColor: '#0273F9', color: '#fff', borderRadius: '8px', fontSize: '14px'}}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Creating...
                </>
              ) : (
                'Create Invoice'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default CreateInvoice
