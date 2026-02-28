import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPrint, faDownload, faEnvelope } from '@fortawesome/free-solid-svg-icons';

const InvoiceDetails = ({ invoice, onBack }) => {
  if (!invoice) {
    return (
      <div className="text-center py-5">
        <p>No invoice selected</p>
        <button onClick={onBack} className="btn" style={{color: '#0273F9'}}>
          Go Back
        </button>
      </div>
    );
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'paid':
        return { backgroundColor: '#DCFCE7', color: '#166534' };
      case 'overdue':
        return { backgroundColor: '#FEE2E2', color: '#991B1B' };
      default:
        return { backgroundColor: '#FEF3C7', color: '#92400E' };
    }
  };

  const calculateSubtotal = () => {
    if (!invoice.items || invoice.items.length === 0) return 0;
    return invoice.items.reduce((sum, item) => {
      const itemTotal = (item.quantity * item.unit_price) - ((item.quantity * item.unit_price * (item.discount_percentage || 0)) / 100);
      return sum + itemTotal;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const taxAmount = (subtotal * (invoice.tax_rate || 0)) / 100;
  const total = subtotal + taxAmount - (invoice.discount_amount || 0);

  return (
    <>
      <div className="p-3">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-3">
            <button 
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
            <div>
              <h6 className="bx mb-0">Invoice #{invoice.invoice_number || invoice.id}</h6>
              <small className="d-block" style={{color: '#78716C'}}>View invoice details</small>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn"
              style={{padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff'}}
            >
              <FontAwesomeIcon icon={faPrint} className="me-2" />Print
            </button>
            <button
              className="btn"
              style={{padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff'}}
            >
              <FontAwesomeIcon icon={faDownload} className="me-2" />Download
            </button>
            <button
              className="btn"
              style={{padding: '8px 16px', backgroundColor: '#0273F9', color: '#fff', borderRadius: '8px', fontSize: '13px'}}
            >
              <FontAwesomeIcon icon={faEnvelope} className="me-2" />Send to Email
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="bg-white rounded-3 p-4" style={{border: '1px solid #eee'}}>
          {/* Invoice Header Info */}
          <div className="d-flex justify-content-between mb-4 pb-4" style={{borderBottom: '1px solid #eee'}}>
            <div>
              <h5 className="mb-1" style={{fontWeight: '600'}}>INVOICE</h5>
              <p className="mb-0" style={{fontSize: '14px', color: '#6B7280'}}>#{invoice.invoice_number || invoice.id}</p>
            </div>
            <div className="text-end">
              <span style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '6px',
                ...getStatusStyle(invoice.status)
              }}>
                {invoice.status || 'pending'}
              </span>
            </div>
          </div>

          {/* Invoice Details Grid */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="mb-4">
                <small style={{color: '#6B7280', fontSize: '12px'}}>From</small>
                <p className="mb-0" style={{fontSize: '14px', fontWeight: '500'}}>{invoice.store_name || 'Your Business'}</p>
                <p className="mb-0" style={{fontSize: '13px', color: '#6B7280'}}>{invoice.store_email || ''}</p>
              </div>
              <div>
                <small style={{color: '#6B7280', fontSize: '12px'}}>Bill To</small>
                <p className="mb-0" style={{fontSize: '14px', fontWeight: '500'}}>{invoice.Customer || invoice.customer_name || 'Customer'}</p>
                <p className="mb-0" style={{fontSize: '13px', color: '#6B7280'}}>{invoice.customer_email || ''}</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="row">
                <div className="col-6 mb-3">
                  <small style={{color: '#6B7280', fontSize: '12px'}}>Issue Date</small>
                  <p className="mb-0" style={{fontSize: '14px'}}>{invoice.issue_date || '-'}</p>
                </div>
                <div className="col-6 mb-3">
                  <small style={{color: '#6B7280', fontSize: '12px'}}>Due Date</small>
                  <p className="mb-0" style={{fontSize: '14px'}}>{invoice.due_date || '-'}</p>
                </div>
                <div className="col-6">
                  <small style={{color: '#6B7280', fontSize: '12px'}}>Currency</small>
                  <p className="mb-0" style={{fontSize: '14px'}}>{invoice.currency || 'NGN'}</p>
                </div>
                <div className="col-6">
                  <small style={{color: '#6B7280', fontSize: '12px'}}>Invoice Total</small>
                  <p className="mb-0" style={{fontSize: '14px', fontWeight: '600', color: '#0273F9'}}>
                    {invoice.currency || '₦'} {(invoice.total || total).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-4">
            <h6 style={{fontSize: '14px', marginBottom: '12px'}}>Invoice Items</h6>
            <table className="table table-borderless" style={{backgroundColor: '#F9FAFB', borderRadius: '8px'}}>
              <thead>
                <tr style={{borderBottom: '1px solid #E5E7EB'}}>
                  <th style={{fontSize: '12px', color: '#6B7280', padding: '12px'}}>Item</th>
                  <th style={{fontSize: '12px', color: '#6B7280', padding: '12px'}}>Description</th>
                  <th style={{fontSize: '12px', color: '#6B7280', padding: '12px', textAlign: 'center'}}>Qty</th>
                  <th style={{fontSize: '12px', color: '#6B7280', padding: '12px', textAlign: 'right'}}>Unit Price</th>
                  <th style={{fontSize: '12px', color: '#6B7280', padding: '12px', textAlign: 'right'}}>Discount</th>
                  <th style={{fontSize: '12px', color: '#6B7280', padding: '12px', textAlign: 'right'}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => {
                    const itemSubtotal = item.quantity * item.unit_price;
                    const itemDiscount = (itemSubtotal * (item.discount_percentage || 0)) / 100;
                    const itemTotal = itemSubtotal - itemDiscount;
                    return (
                      <tr key={index} style={{borderBottom: '1px solid #E5E7EB'}}>
                        <td style={{fontSize: '13px', padding: '12px'}}>{item.item_name}</td>
                        <td style={{fontSize: '13px', padding: '12px', color: '#6B7280'}}>{item.description || '-'}</td>
                        <td style={{fontSize: '13px', padding: '12px', textAlign: 'center'}}>{item.quantity}</td>
                        <td style={{fontSize: '13px', padding: '12px', textAlign: 'right'}}>
                          {invoice.currency || '₦'} {item.unit_price?.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                        <td style={{fontSize: '13px', padding: '12px', textAlign: 'right'}}>
                          {item.discount_percentage ? `${item.discount_percentage}%` : '-'}
                        </td>
                        <td style={{fontSize: '13px', padding: '12px', textAlign: 'right', fontWeight: '500'}}>
                          {invoice.currency || '₦'} {itemTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-3" style={{color: '#6B7280'}}>No items</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="row">
            <div className="col-md-6">
              {invoice.notes && (
                <div>
                  <h6 style={{fontSize: '14px', marginBottom: '8px'}}>Notes</h6>
                  <p style={{fontSize: '13px', color: '#6B7280', whiteSpace: 'pre-line'}}>{invoice.notes}</p>
                </div>
              )}
            </div>
            <div className="col-md-6">
              <div className="p-3 rounded-3" style={{backgroundColor: '#F9FAFB'}}>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{fontSize: '13px', color: '#6B7280'}}>Subtotal</span>
                  <span style={{fontSize: '13px'}}>{invoice.currency || '₦'} {subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{fontSize: '13px', color: '#6B7280'}}>Tax ({invoice.tax_rate || 0}%)</span>
                  <span style={{fontSize: '13px'}}>{invoice.currency || '₦'} {taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{fontSize: '13px', color: '#6B7280'}}>Discount</span>
                  <span style={{fontSize: '13px', color: '#DC2626'}}>- {invoice.currency || '₦'} {(invoice.discount_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <hr className="my-2" />
                <div className="d-flex justify-content-between">
                  <span style={{fontSize: '15px', fontWeight: '600'}}>Total</span>
                  <span style={{fontSize: '15px', fontWeight: '600', color: '#0273F9'}}>
                    {invoice.currency || '₦'} {(invoice.total || total).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default InvoiceDetails
