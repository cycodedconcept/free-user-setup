import React, { useState, useEffect, useRef } from 'react'
import stylesItem from '../../../Tabs.module.css';
import InvoiceCards from './InvoiceCards';
import { useDispatch, useSelector } from 'react-redux';
import { getAllInvoice, updateInvoiceStatus } from '../../../slice/invoiceSlice';
import Swal from 'sweetalert2';
import Pagination from '../../../components/Pagination';
import CreateInvoice from '../crm/CreateInvoice';
import InvoiceDetails from './InvoiceDetails';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faEye, faPen, faTrash, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { Tiv, Pb2, Tp, Tm, Upi } from '../../../assets';

const AllInvoices = () => {
  const dispatch = useDispatch();
  let token = localStorage.getItem("token");
  const {loading, error, success, invoiceData } = useSelector((state) => state.invoice);
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'details'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const invoicePagination = invoiceData?.pagination || {};
  const invoices = invoiceData?.data || [];

  const normalizeStatus = (status) => String(status || '').trim().toLowerCase();
  const totalInvoices = invoicePagination?.total_items || invoices.length;
  const paidInvoices = invoices.filter((invoice) => normalizeStatus(invoice.status) === 'paid').length;
  const overdueInvoices = invoices.filter((invoice) => normalizeStatus(invoice.status) === 'overdue').length;
  const unpaidInvoices = invoices.filter((invoice) => {
    const normalizedStatus = normalizeStatus(invoice.status);
    return normalizedStatus !== 'paid' && normalizedStatus !== 'overdue';
  }).length;
  const totalValue = invoices.reduce((sum, invoice) => sum + Number(invoice?.total || 0), 0);
  const invoiceCards = [
    {
      id: 0,
      name: "Total Invoice",
      figure: totalInvoices.toLocaleString(),
      icon: Tiv
    },
    {
      id: 1,
      name: "Paid Invoice",
      figure: paidInvoices.toLocaleString(),
      icon: Pb2
    },
    {
      id: 3,
      name: "Unpaid Invoices",
      figure: unpaidInvoices.toLocaleString(),
      icon: Upi
    },
    {
      id: 2,
      name: "Overdue",
      figure: overdueInvoices.toLocaleString(),
      icon: Tp
    },
    {
      id: 4,
      name: "Total Value",
      figure: new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 2
      }).format(totalValue),
      icon: Tm
    }
  ];

  useEffect(() => {
    if (token) {
        dispatch(getAllInvoice({token, page: currentPage, limit: 20}))
    }
  }, [token, dispatch, currentPage])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const toggleDropdown = (invoiceId) => {
    setOpenDropdown(openDropdown === invoiceId ? null : invoiceId);
  };

  const isUpdateDisabled = (invoice) => {
    const status = normalizeStatus(invoice?.status);
    return status === 'paid' || status === 'cancelled' || status === 'canceled';
  };

  const getStatusStyle = (status) => {
    const normalizedStatus = normalizeStatus(status);

    if (normalizedStatus === 'paid') {
      return { backgroundColor: '#DCFCE7', color: '#166534' };
    }

    if (normalizedStatus === 'overdue') {
      return { backgroundColor: '#FEE2E2', color: '#991B1B' };
    }

    if (normalizedStatus === 'cancelled' || normalizedStatus === 'canceled') {
      return { backgroundColor: '#E5E7EB', color: '#374151' };
    }

    return { backgroundColor: '#FEF3C7', color: '#92400E' };
  };

  const formatDateInputValue = (value) => {
    if (!value) {
      return '';
    }

    return String(value).split('T')[0];
  };

  const getCustomerName = (invoice) => {
    const customer = invoice?.Customer || invoice?.customer;

    if (typeof customer === 'string') {
      return customer;
    }

    if (customer && typeof customer === 'object') {
      return customer.name || customer.email || customer.phone || `Customer #${customer.id}`;
    }

    return invoice?.customer_name || invoice?.customer_email || '-';
  };

  const handlePreview = (invoice) => {
    if (invoice.preview_url) {
      window.open(invoice.preview_url, '_blank');
    } else {
      setSelectedInvoice(invoice);
      setView('details');
    }
    setOpenDropdown(null);
  };

  const handleUpdate = (invoice) => {
    if (isUpdateDisabled(invoice)) {
      setOpenDropdown(null);
      return;
    }

    setSelectedInvoice(invoice);
    setView('edit');
    setOpenDropdown(null);
  };

  const handleUpdatePaymentStatus = async (invoice) => {
    setOpenDropdown(null);

    const currentStatus = normalizeStatus(invoice?.status) || 'draft';
    const result = await Swal.fire({
      title: `Update Status: ${invoice.invoice_number || invoice.id}`,
      width: 420,
      padding: '1.25rem',
      html: `
        <div style="display:flex; flex-direction:column; gap:12px; text-align:left;">
          <div>
            <label for="invoice-status" style="display:block; font-size:13px; color:#374151; margin-bottom:6px;">Status</label>
            <select id="invoice-status" class="swal2-input" style="margin:0; width:100%;">
              <option value="draft" ${currentStatus === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="sent" ${currentStatus === 'sent' ? 'selected' : ''}>Sent</option>
              <option value="paid" ${currentStatus === 'paid' ? 'selected' : ''}>Paid</option>
              <option value="overdue" ${currentStatus === 'overdue' ? 'selected' : ''}>Overdue</option>
              <option value="cancelled" ${currentStatus === 'cancelled' || currentStatus === 'canceled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
          <div>
            <label for="payment-method" style="display:block; font-size:13px; color:#374151; margin-bottom:6px;">Payment Method</label>
            <select id="payment-method" class="swal2-input" style="margin:0; width:100%;">
              <option value="Bank Transfer" ${(invoice?.payment_method || '') === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
              <option value="Cash" ${(invoice?.payment_method || '') === 'Cash' ? 'selected' : ''}>Cash</option>
            </select>
          </div>
          <div>
            <label for="payment-date" style="display:block; font-size:13px; color:#374151; margin-bottom:6px;">Payment Date</label>
            <input id="payment-date" type="date" class="swal2-input" style="margin:0; width:100%;" value="${formatDateInputValue(invoice?.payment_date)}" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Update Status',
      confirmButtonColor: '#0273F9',
      cancelButtonColor: '#6B7280',
      focusConfirm: false,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      didOpen: () => {
        const title = Swal.getTitle();
        const confirmButton = Swal.getConfirmButton();
        const cancelButton = Swal.getCancelButton();
        const statusField = document.getElementById('invoice-status');
        const paymentMethodField = document.getElementById('payment-method');
        const paymentDateField = document.getElementById('payment-date');

        if (title) {
          title.style.fontSize = '18px';
          title.style.fontWeight = '600';
        }

        [confirmButton, cancelButton].forEach((button) => {
          if (button) {
            button.style.fontSize = '13px';
            button.style.padding = '8px 14px';
          }
        });

        [statusField, paymentMethodField, paymentDateField].forEach((field) => {
          if (field) {
            field.style.fontSize = '13px';
            field.style.minHeight = '40px';
            field.style.padding = '8px 10px';
          }
        });
      },
      preConfirm: async () => {
        const status = document.getElementById('invoice-status')?.value;
        const paymentMethod = document.getElementById('payment-method')?.value;
        const paymentDate = document.getElementById('payment-date')?.value;

        if (!status || !paymentMethod || !paymentDate) {
          Swal.showValidationMessage('Status, payment method, and payment date are required.');
          return false;
        }

        try {
          await dispatch(updateInvoiceStatus({
            token,
            id: invoice.id,
            status,
            payment_method: paymentMethod,
            payment_date: paymentDate
          })).unwrap();

          return { status, paymentMethod, paymentDate };
        } catch (updateError) {
          Swal.showValidationMessage(updateError?.message || 'Failed to update invoice status.');
          return false;
        }
      }
    });

    if (result.isConfirmed) {
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: 'Invoice payment status updated successfully.',
      });
    }
  };

  const handleDelete = (invoice) => {
    Swal.fire({
      title: 'Delete Invoice?',
      text: `Are you sure you want to delete invoice ${invoice.invoice_number || invoice.id}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        // dispatch delete action here
        console.log('Delete invoice:', invoice.id);
      }
    });
    setOpenDropdown(null);
  };

  return (
    <>
      {view === 'list' ? (
        <>
            <div className="d-flex justify-content-between">
                <div>
                    <h6 className="bx">Invoices</h6>
                    <small className="d-block">Manage and track all your invoices</small>
                </div>
                <div>
                    <button className={`mx ms-auto rounded-3 ${stylesItem.jBtn}`} onClick={() => setView('create')}>Create New Invoice</button>
                </div>
            </div>

            <InvoiceCards cardDetails={invoiceCards} />

            {/* Invoice Table */}
            <div className="bg-white rounded-3 p-3 mt-4" style={{border: '1px solid #eee'}}>
            <table className="table table-borderless">
                <thead>
                <tr style={{borderBottom: '1px solid #eee'}}>
                    <th style={{fontSize: '13px', color: '#78716C'}}>Invoice ID</th>
                    <th style={{fontSize: '13px', color: '#78716C'}}>Customer Name</th>
                    <th style={{fontSize: '13px', color: '#78716C'}}>Amount</th>
                    <th style={{fontSize: '13px', color: '#78716C'}}>Issue Date</th>
                    <th style={{fontSize: '13px', color: '#78716C'}}>Due Date</th>
                    <th style={{fontSize: '13px', color: '#78716C'}}>Status</th>
                    <th style={{fontSize: '13px', color: '#78716C'}}>Action</th>
                </tr>
                </thead>
                <tbody>
                {loading ? (
                    <tr>
                    <td colSpan="7" className="text-center py-4">
                        <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                        </div>
                    </td>
                    </tr>
                ) : invoices.length > 0 ? (
                    invoices.map((invoice) => (
                    <tr key={invoice.id} style={{borderBottom: '1px solid #eee'}}>
                        <td style={{fontSize: '13px'}}>{invoice.invoice_number || invoice.id}</td>
                        <td style={{fontSize: '13px'}}>{getCustomerName(invoice)}</td>
                        <td style={{fontSize: '13px'}}>₦{invoice.total?.toLocaleString() || '0'}</td>
                        <td style={{fontSize: '13px'}}>{invoice.issue_date}</td>
                        <td style={{fontSize: '13px'}}>{invoice.due_date}</td>
                        {/* <td style={{fontSize: '13px'}}>{invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : '-'}</td> */}
                        <td>
                        <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            ...getStatusStyle(invoice.status)
                        }}>
                            {invoice.status || 'pending'}
                        </span>
                        </td>
                        <td>
                          <div style={{position: 'relative'}} ref={openDropdown === invoice.id ? dropdownRef : null}>
                            <button 
                              className="btn btn-sm" 
                              style={{fontSize: '14px', color: '#6B7280'}}
                              onClick={() => toggleDropdown(invoice.id)}
                            >
                              <FontAwesomeIcon icon={faEllipsisV} />
                            </button>
                            
                            {openDropdown === invoice.id && (
                              <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                backgroundColor: '#fff',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                zIndex: 10,
                                minWidth: '150px'
                              }}>
                                <button
                                  onClick={() => handlePreview(invoice)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    fontSize: '13px',
                                    color: '#374151',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                  }}
                                  onMouseOver={(e) => e.target.style.backgroundColor = '#F3F4F6'}
                                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                  <FontAwesomeIcon icon={faEye} style={{color: '#0273F9'}} /> Preview
                                </button>
                                <button
                                  onClick={() => handleUpdate(invoice)}
                                  disabled={isUpdateDisabled(invoice)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    fontSize: '13px',
                                    color: isUpdateDisabled(invoice) ? '#9CA3AF' : '#374151',
                                    cursor: isUpdateDisabled(invoice) ? 'not-allowed' : 'pointer',
                                    opacity: isUpdateDisabled(invoice) ? 0.7 : 1,
                                    textAlign: 'left'
                                  }}
                                  title={isUpdateDisabled(invoice) ? 'Paid or cancelled invoices cannot be updated' : 'Update invoice'}
                                  onMouseOver={(e) => {
                                    if (!isUpdateDisabled(invoice)) {
                                      e.target.style.backgroundColor = '#F3F4F6';
                                    }
                                  }}
                                  onMouseOut={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <FontAwesomeIcon icon={faPen} style={{color: '#F59E0B'}} /> Update
                                </button>
                                <button
                                  onClick={() => handleUpdatePaymentStatus(invoice)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    fontSize: '13px',
                                    color: '#374151',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                  }}
                                  onMouseOver={(e) => e.target.style.backgroundColor = '#F3F4F6'}
                                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                  <FontAwesomeIcon icon={faMoneyBillWave} style={{color: '#10B981'}} /> Update Status
                                </button>
                                <button
                                  onClick={() => handleDelete(invoice)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    fontSize: '13px',
                                    color: '#DC2626',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                  }}
                                  onMouseOver={(e) => e.target.style.backgroundColor = '#FEE2E2'}
                                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                  <FontAwesomeIcon icon={faTrash} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                    <td colSpan="7" className="text-center py-4" style={{color: '#78716C'}}>
                        No invoices found
                    </td>
                    </tr>
                )}
                </tbody>
            </table>

            {/* Pagination */}
            <Pagination
                currentPage={invoicePagination?.page || currentPage}
                totalPages={invoicePagination?.total_pages || 1}
                onPageChange={handlePageChange}
                itemsPerPage={invoicePagination?.limit || 20}
                totalItems={invoicePagination?.total_items || invoiceData?.data?.length || 0}
                disabled={loading}
            />
            </div>
        </>
      ) : view === 'create' ? (
        <CreateInvoice onBack={() => setView('list')} />
      ) : view === 'edit' ? (
        <CreateInvoice
          mode="edit"
          invoice={selectedInvoice}
          onBack={() => setView('list')}
        />
      ) : (
        <InvoiceDetails invoice={selectedInvoice} onBack={() => setView('list')} />
      )}
    </>
  )
}

export default AllInvoices
