import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { addPaymentGateway, resetStatus, getPaymentWays, updatePaymentGateway, deletePaymentGateway } from '../../../slice/paymentSlice';
import Swal from 'sweetalert2';
import styles from '../../styles.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faKey, faShieldAlt, faChevronLeft, faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const gatewayOptions = [
  { value: 'paystack', label: 'Paystack' },
  { value: 'flutterwave', label: 'Flutterwave' },
  { value: 'stripe', label: 'Stripe' },
];

const Payment = () => {
  const dispatch = useDispatch();
  let token = localStorage.getItem("token");
  const { loading, error, success, payments } = useSelector((state) => state.payment);

  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingGatewayId, setEditingGatewayId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    gateway_name: '',
    public_key: '',
    secret_key: '',
    webhook_secret: '',
    test_mode: true,
    is_default: false,
  });

  const [formErrors, setFormErrors] = useState({});

  const gateways = payments?.data?.gateways || [];

  // Fetch payment gateways on mount
  useEffect(() => {
    dispatch(getPaymentWays({ token }));
  }, [dispatch, token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.gateway_name) errors.gateway_name = 'Gateway name is required';
    if (!formData.public_key) errors.public_key = 'Public key is required';
    // Secret key only required for new gateways
    if (!editMode && !formData.secret_key) errors.secret_key = 'Secret key is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    Swal.fire({
      title: editMode ? 'Updating Payment Gateway...' : 'Adding Payment Gateway...',
      text: 'Please wait while we process your request.',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    if (editMode) {
      dispatch(updatePaymentGateway({ token, id: editingGatewayId, ...formData }));
    } else {
      dispatch(addPaymentGateway({ token, ...formData }));
    }
  };

  const handleEdit = (gateway) => {
    setFormData({
      gateway_name: gateway.gateway_name,
      public_key: gateway.public_key,
      secret_key: '', // Don't pre-fill secret key for security
      webhook_secret: gateway.webhook_secret || '',
      test_mode: gateway.test_mode,
      is_default: gateway.is_default,
    });
    setEditingGatewayId(gateway.id);
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = (gateway) => {
    Swal.fire({
      title: 'Delete Payment Gateway?',
      html: `Are you sure you want to delete <strong style="color: #DC2626;">${gateway.gateway_name}</strong>? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Deleting Payment Gateway...',
          text: 'Please wait while we process your request.',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        setIsDeleting(true);
        dispatch(deletePaymentGateway({ token, id: gateway.id }));
      }
    });
  };

  const resetForm = () => {
    setFormData({
      gateway_name: '',
      public_key: '',
      secret_key: '',
      webhook_secret: '',
      test_mode: true,
      is_default: false,
    });
    setFormErrors({});
    setEditMode(false);
    setEditingGatewayId(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  useEffect(() => {
    if (success) {
      let successMessage = 'Payment gateway added successfully!';
      if (isDeleting) {
        successMessage = 'Payment gateway deleted successfully!';
      } else if (editMode) {
        successMessage = 'Payment gateway updated successfully!';
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: successMessage,
        confirmButtonColor: '#0273F9',
      });
      resetForm();
      setShowForm(false);
      setIsDeleting(false);
      dispatch(getPaymentWays({ token })); // Refresh the list
      dispatch(resetStatus());
    }
  }, [success, dispatch, token, editMode, isDeleting]);

  useEffect(() => {
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.message || 'Failed to add payment gateway',
        confirmButtonColor: '#0273F9',
      });
      dispatch(resetStatus());
    }
  }, [error, dispatch]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const maskKey = (key) => {
    if (!key) return '';
    return key.substring(0, 12) + '...' + key.substring(key.length - 4);
  };

  // Show Form View
  if (showForm) {
    return (
      <>
        <button 
          className="btn mb-3" 
          style={{ fontSize: '15px' }} 
          onClick={handleCancel}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
          Back to Payment Gateways
        </button>

        <div className={`${styles['service-card']} p-0`} style={{maxWidth: '1000px'}}>
          {/* Header */}
          <div className="p-3 border-bottom">
            <h5 className="mb-1">{editMode ? 'Edit Payment Gateway' : 'Add Payment Gateway'}</h5>
            <small style={{ color: '#78716C' }}>
              {editMode 
                ? 'Update your payment gateway configuration.' 
                : 'Configure a new payment gateway to accept payments from your customers.'}
            </small>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-3">
            <div className="row g-3">
              {/* Gateway Provider */}
              <div className="col-12">
                <label className="form-label d-block" style={{ fontSize: '13px' }}>Gateway Provider <span className="text-danger">*</span></label>
                <select
                  name="gateway_name"
                  value={formData.gateway_name}
                  onChange={handleChange}
                  className={styles['input-item']}
                >
                  <option value="">Select a payment gateway</option>
                  {gatewayOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {formErrors.gateway_name && <small className="text-danger">{formErrors.gateway_name}</small>}
              </div>

              {/* Public Key */}
              <div className="col-md-6">
                <label className="form-label d-block" style={{ fontSize: '13px' }}>Public Key <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="public_key"
                  value={formData.public_key}
                  onChange={handleChange}
                  placeholder="pk_test_xxxxxxxxxxxxx"
                  className={styles['input-item']}
                />
                {formErrors.public_key && <small className="text-danger">{formErrors.public_key}</small>}
              </div>

              {/* Secret Key */}
              <div className="col-md-6">
                <label className="form-label d-block" style={{ fontSize: '13px' }}>
                  Secret Key {!editMode && <span className="text-danger">*</span>}
                </label>
                <input
                  type="password"
                  name="secret_key"
                  value={formData.secret_key}
                  onChange={handleChange}
                  placeholder={editMode ? 'Leave blank to keep current' : 'sk_test_xxxxxxxxxxxxx'}
                  className={styles['input-item']}
                />
                {formErrors.secret_key && <small className="text-danger">{formErrors.secret_key}</small>}
                {editMode && <small style={{ color: '#78716C' }}>Leave blank to keep existing secret key</small>}
              </div>

              {/* Webhook Secret */}
              <div className="col-12">
                <label className="form-label d-block" style={{ fontSize: '13px' }}>Webhook Secret</label>
                <input
                  type="text"
                  name="webhook_secret"
                  value={formData.webhook_secret}
                  onChange={handleChange}
                  placeholder="whsec_xxxxxxxxxxxxx"
                  className={styles['input-item']}
                />
                <small style={{ color: '#78716C' }}>Used to verify webhook signatures from the payment provider</small>
              </div>
            </div>

            {/* Gateway Settings */}
            <div className="mt-4 pt-3 border-top">
              <h6 className="mb-3">Gateway Settings</h6>
              
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div>
                  <span className="d-block" style={{ fontSize: '14px' }}>Test Mode</span>
                  <small style={{ color: '#78716C' }}>Enable test mode to process test transactions only</small>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    name="test_mode"
                    checked={formData.test_mode}
                    onChange={handleChange}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className="d-flex justify-content-between align-items-center py-2">
                <div>
                  <span className="d-block" style={{ fontSize: '14px' }}>Set as Default</span>
                  <small style={{ color: '#78716C' }}>Use this gateway as the default payment method</small>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleChange}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>

            {/* Security Info */}
            <div className="mt-4 pt-3 border-top">
              <h6 className="mb-3">Security Information</h6>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex align-items-center gap-2">
                  <FontAwesomeIcon icon={faShieldAlt} style={{ color: '#0EC049' }} />
                  <small style={{ color: '#78716C' }}>All credentials are encrypted with AES-256</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <FontAwesomeIcon icon={faKey} style={{ color: '#0EC049' }} />
                  <small style={{ color: '#78716C' }}>Secret keys are never exposed in client-side code</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <FontAwesomeIcon icon={faCreditCard} style={{ color: '#0EC049' }} />
                  <small style={{ color: '#78716C' }}>PCI DSS compliant payment processing</small>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button type="button" className={styles['topBtn']} style={{ padding: '10px 20px' }} onClick={handleCancel}>Cancel</button>
              <button type="submit" className={styles['si-btn']} disabled={loading}>
                {editMode ? 'Update Gateway' : 'Add Payment Gateway'}
              </button>
            </div>
          </form>
        </div>
      </>
    );
  }

  // Show Table View (default)
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">Payment Gateways</h5>
          <small style={{ color: '#78716C' }}>Manage your payment gateways and configurations</small>
        </div>
        <button 
          className={`p-3 ${styles['si-btn']}`} 
          onClick={() => setShowForm(true)}
        >
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Add Payment Gateway
        </button>
      </div>

      <div className="card shadow-sm rounded-3" style={{ border: '1px solid #eee' }}>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr className={styles.tableHeader}>
                  <th scope="col" className="fw-semibold p-3">#</th>
                  <th scope="col" className="fw-semibold p-3">Gateway</th>
                  <th scope="col" className="fw-semibold p-3">Public Key</th>
                  <th scope="col" className="fw-semibold p-3">Mode</th>
                  <th scope="col" className="fw-semibold p-3">Status</th>
                  <th scope="col" className="fw-semibold p-3">Default</th>
                  <th scope="col" className="fw-semibold p-3">Created</th>
                  <th scope="col" className="fw-semibold p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && gateways.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2">Loading payment gateways...</span>
                    </td>
                  </tr>
                ) : gateways.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <p className="text-muted mb-0">No payment gateways configured yet.</p>
                      <button 
                        className="btn btn-link text-primary p-0 mt-2" 
                        onClick={() => setShowForm(true)}
                      >
                        Add your first payment gateway
                      </button>
                    </td>
                  </tr>
                ) : (
                  gateways.map((gateway, index) => (
                    <tr key={gateway.id} className={styles.tableHeader}>
                      <td className="p-3" style={{ lineHeight: '2.5' }}>{index + 1}</td>
                      <td className="p-3" style={{ lineHeight: '2.5', textTransform: 'capitalize' }}>
                        <strong>{gateway.gateway_name}</strong>
                      </td>
                      <td className="p-3" style={{ lineHeight: '2.5' }}>
                        <code style={{ fontSize: '12px', background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
                          {maskKey(gateway.public_key)}
                        </code>
                      </td>
                      <td className="p-3" style={{ lineHeight: '2.5' }}>
                        <span className={`badge ${gateway.test_mode ? 'bg-warning text-dark' : 'bg-success'}`}>
                          {gateway.test_mode ? 'Test' : 'Live'}
                        </span>
                      </td>
                      <td className="p-3" style={{ lineHeight: '2.5' }}>
                        <span className={`badge ${gateway.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {gateway.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3" style={{ lineHeight: '2.5' }}>
                        {gateway.is_default ? (
                          <span className="badge bg-primary">Default</span>
                        ) : (
                          <span style={{ color: '#78716C' }}>—</span>
                        )}
                      </td>
                      <td className="p-3" style={{ lineHeight: '2.5', color: '#78716C' }}>
                        {formatDate(gateway.created_at)}
                      </td>
                      <td className="p-3" style={{ lineHeight: '2.5' }}>
                        <div className="d-flex gap-3">
                          <button
                            className="btn btn-link p-0 text-primary"
                            onClick={() => handleEdit(gateway)}
                            title="Edit Gateway"
                            style={{ textDecoration: 'none', fontSize: '13px' }}
                          >
                            <FontAwesomeIcon icon={faEdit} className="me-1" />
                            Edit
                          </button>
                          <button
                            className="btn btn-link p-0 text-danger"
                            onClick={() => handleDelete(gateway)}
                            title="Delete Gateway"
                            style={{ textDecoration: 'none', fontSize: '13px' }}
                          >
                            <FontAwesomeIcon icon={faTrash} className="me-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default Payment

