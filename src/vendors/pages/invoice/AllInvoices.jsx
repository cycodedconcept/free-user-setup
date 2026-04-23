import React, { useState, useEffect, useRef } from 'react'
import stylesItem from '../../../Tabs.module.css';
import styles from "../../../styles.module.css";
import InvoiceCards from './InvoiceCards';
import { useDispatch, useSelector } from 'react-redux';
import { getAllInvoice, updateInvoiceStatus } from '../../../slice/invoiceSlice';
import {
  generateReceiptFromInvoice,
  getInvoiceReceipts,
  resetInvoiceReceipts
} from '../../../slice/order';
import { getMyOnlineStore } from '../../../slice/onlineStoreSlice';
import { API_URL } from '../../../config/constant';
import Swal from 'sweetalert2';
import Pagination from '../../../components/Pagination';
import CreateInvoice from '../crm/CreateInvoice';
import InvoiceDetails from './InvoiceDetails';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faEye, faPen, faTrash, faMoneyBillWave, faReceipt, faSearch } from '@fortawesome/free-solid-svg-icons';
import { Tiv, Pb2, Tp, Tm, Upi, Logo } from '../../../assets';

const resolveStoreInfo = (myStore) =>
  myStore?.onlineStore || myStore?.data?.onlineStore || myStore?.store || {};

const resolveStoreLogoUrl = (storeInfo) => {
  const candidate = storeInfo?.profile_logo_url || storeInfo?.logo || Logo;

  if (!candidate) {
    return '';
  }

  if (
    candidate.startsWith('http://') ||
    candidate.startsWith('https://') ||
    candidate.startsWith('data:') ||
    candidate.startsWith('blob:')
  ) {
    return candidate;
  }

  if (typeof window !== 'undefined') {
    return new URL(candidate, window.location.origin).href;
  }

  return candidate;
};

const resolveReceiptFileUrl = (value) => {
  if (!value) {
    return '';
  }

  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  ) {
    return value;
  }

  const normalizedValue = value.startsWith('/') ? value : `/${value}`;
  return new URL(normalizedValue, API_URL).href;
};

const formatReceiptDateTime = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const AllInvoices = () => {
  const dispatch = useDispatch();
  let token = localStorage.getItem("token");
  const {loading, invoiceData } = useSelector((state) => state.invoice);
  const {
    createReceiptLoading,
    invoiceReceiptsLoading,
    invoiceReceiptsError,
    invoiceReceiptsData
  } = useSelector((state) => state.order);
  const myStore = useSelector((state) => state.store?.myStore);
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'details'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [generatingReceiptId, setGeneratingReceiptId] = useState(null);
  const [receiptsModalInvoice, setReceiptsModalInvoice] = useState(null);
  const [fetchingReceiptsInvoiceId, setFetchingReceiptsInvoiceId] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const storeInfo = resolveStoreInfo(myStore);
  const storeLogoUrl = resolveStoreLogoUrl(storeInfo);
  const isGeneratingReceipt = createReceiptLoading && generatingReceiptId !== null;
  const invoiceReceipts = invoiceReceiptsData?.data || [];
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

  useEffect(() => {
    if (token && !storeInfo?.id) {
      dispatch(getMyOnlineStore({ token }));
    }
  }, [dispatch, storeInfo?.id, token]);

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

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setSearchTerm(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
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

  const filteredInvoices = invoices.filter((invoice) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return true;
    }

    return [
      invoice?.invoice_number,
      invoice?.id,
      getCustomerName(invoice),
      invoice?.customer_email,
      invoice?.customer_phone,
      invoice?.status,
      invoice?.total,
      invoice?.issue_date,
      invoice?.due_date,
    ]
      .filter((value) => value !== undefined && value !== null)
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
  });

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

  const handleGenerateReceipt = async (invoice) => {
    setOpenDropdown(null);
    setGeneratingReceiptId(invoice.id);

    try {
      const response = await dispatch(
        generateReceiptFromInvoice({
          token,
          invoiceId: invoice.id
        })
      ).unwrap();

      const receiptData = response?.data || {};
      const previewUrl = receiptData?.preview_url;
      const pdfUrl = receiptData?.pdf_url;

      const result = await Swal.fire({
        icon: 'success',
        title: receiptData?.already_exists ? 'Receipt Already Exists' : 'Receipt Generated',
        text: response?.message || 'Receipt generated successfully.',
        showCancelButton: Boolean(previewUrl),
        cancelButtonText: 'Preview Receipt',
        confirmButtonText: pdfUrl ? 'Download PDF' : 'Close',
        confirmButtonColor: '#0273F9',
        cancelButtonColor: '#10B981',
      });

      if (result.isConfirmed && pdfUrl) {
        window.open(pdfUrl, '_blank');
      }

      if (result.dismiss === Swal.DismissReason.cancel && previewUrl) {
        window.open(previewUrl, '_blank');
      }
    } catch (receiptError) {
      Swal.fire({
        icon: 'error',
        title: 'Receipt Generation Failed',
        text: receiptError?.message || receiptError?.error || 'Unable to generate receipt for this invoice.',
      });
    } finally {
      setGeneratingReceiptId(null);
    }
  };

  const handleGetReceipts = async (invoice) => {
    setOpenDropdown(null);
    setReceiptsModalInvoice(invoice);
    setFetchingReceiptsInvoiceId(invoice.id);

    try {
      await dispatch(
        getInvoiceReceipts({
          token,
          invoiceId: invoice.id
        })
      ).unwrap();
    } catch (receiptListError) {
      console.error('Failed to fetch invoice receipts:', receiptListError);
    } finally {
      setFetchingReceiptsInvoiceId(null);
    }
  };

  const closeReceiptsModal = () => {
    setReceiptsModalInvoice(null);
    setFetchingReceiptsInvoiceId(null);
    dispatch(resetInvoiceReceipts());
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
      <style>
        {`
          @keyframes invoiceReceiptLogoPulse {
            0% { transform: scale(0.94); opacity: 0.75; }
            50% { transform: scale(1.02); opacity: 1; }
            100% { transform: scale(0.94); opacity: 0.75; }
          }
        `}
      </style>
      {isGeneratingReceipt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(4px)',
            zIndex: 2500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div
            style={{
              width: 'min(320px, 100%)',
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '28px 24px',
              textAlign: 'center',
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.28)'
            }}
          >
            <img
              src={storeLogoUrl}
              alt={`${storeInfo?.store_name || 'Store'} logo`}
              style={{
                width: '88px',
                height: '88px',
                objectFit: 'cover',
                borderRadius: '50%',
                display: 'block',
                margin: '0 auto 18px',
                border: '4px solid rgba(2, 115, 249, 0.12)',
                animation: 'invoiceReceiptLogoPulse 1.4s ease-in-out infinite'
              }}
            />
            <h6 style={{ marginBottom: '8px', color: '#111827' }}>Generating Receipt</h6>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '13px', lineHeight: 1.6 }}>
              Please wait while we prepare the receipt for invoice #{generatingReceiptId}.
            </p>
          </div>
        </div>
      )}
      {receiptsModalInvoice && (
        <div
          onClick={closeReceiptsModal}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.62)',
            zIndex: 2400,
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className={styles.vendorInvoiceModalShell}
          >
            <div
              className={`${styles.vendorInvoiceModalHeader} px-4 py-3`}
            >
              <div>
                <h6 className="mb-1">Invoice Receipts</h6>
                <small style={{ color: '#6B7280' }}>
                  Invoice #{receiptsModalInvoice?.invoice_number || receiptsModalInvoice?.id} • {invoiceReceiptsData?.total || invoiceReceipts.length} receipt(s)
                </small>
              </div>
              <button
                type="button"
                className="btn"
                onClick={closeReceiptsModal}
                style={{
                  padding: '8px 14px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '13px',
                  backgroundColor: '#fff'
                }}
              >
                Close
              </button>
            </div>
            <div className={styles.vendorInvoiceModalBody}>
              {invoiceReceiptsLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading receipts...</span>
                  </div>
                  <p style={{ marginTop: '12px', marginBottom: 0, color: '#6B7280', fontSize: '13px' }}>
                    Loading receipts for this invoice...
                  </p>
                </div>
              ) : invoiceReceiptsError ? (
                <div
                  style={{
                    border: '1px solid #FECACA',
                    backgroundColor: '#FEF2F2',
                    color: '#991B1B',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    fontSize: '13px'
                  }}
                >
                  {invoiceReceiptsError?.message || invoiceReceiptsError?.error || 'Unable to load receipts for this invoice.'}
                </div>
              ) : invoiceReceipts.length > 0 ? (
                <div className={styles.vendorInvoiceItemTableWrap}>
                <table className={`table table-borderless align-middle mb-0 ${styles.vendorInvoiceItemTable}`}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <th style={{ fontSize: '13px', color: '#78716C' }}>Receipt Number</th>
                      <th style={{ fontSize: '13px', color: '#78716C' }}>Created At</th>
                      <th style={{ fontSize: '13px', color: '#78716C' }}>Preview</th>
                      <th style={{ fontSize: '13px', color: '#78716C' }}>PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceReceipts.map((receipt) => {
                      const previewUrl = resolveReceiptFileUrl(receipt?.preview_url);
                      const pdfUrl = resolveReceiptFileUrl(receipt?.pdf_url);

                      return (
                        <tr key={receipt.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ fontSize: '13px', color: '#111827' }}>
                            {receipt.receipt_number || `Receipt #${receipt.id}`}
                          </td>
                          <td style={{ fontSize: '13px', color: '#4B5563' }}>
                            {formatReceiptDateTime(receipt.created_at)}
                          </td>
                          <td>
                            {previewUrl ? (
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => window.open(previewUrl, '_blank')}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #BFDBFE',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  color: '#1D4ED8',
                                  backgroundColor: '#EFF6FF'
                                }}
                              >
                                Open Preview
                              </button>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Not available</span>
                            )}
                          </td>
                          <td>
                            {pdfUrl ? (
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => window.open(pdfUrl, '_blank')}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #D1FAE5',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  color: '#047857',
                                  backgroundColor: '#ECFDF5'
                                }}
                              >
                                Open PDF
                              </button>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Not available</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              ) : (
                <div
                  className={`text-center py-5 ${styles.vendorInvoiceEmptyState}`}
                  style={{ color: '#6B7280' }}
                >
                  <p style={{ marginBottom: '6px', fontSize: '14px', color: '#111827' }}>No receipts found</p>
                  <small>No generated receipts are available for this invoice yet.</small>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {view === 'list' ? (
        <>
            <div className={`${styles.vendorInvoicePage} ${styles.vendorInvoiceHeader}`}>
                <div className={styles.vendorInvoiceHeaderCopy}>
                    <h6 className="bx">Invoices</h6>
                    <small className="d-block">Manage and track all your invoices</small>
                </div>
                <div className={styles.vendorInvoiceHeaderActions}>
                    <button className={`mx ms-auto rounded-3 ${stylesItem.jBtn}`} onClick={() => setView('create')}>Create New Invoice</button>
                </div>
            </div>

            <InvoiceCards cardDetails={invoiceCards} />

            {/* Invoice Table */}
            <div className={`${styles.vendorInvoicePage} ${styles.vendorInvoicePanel} p-3 mt-4`}>
            <form
              className={`${styles.vendorInvoiceToolbar} mb-3`}
              onSubmit={handleSearchSubmit}
            >
              <div
                className={styles.vendorInvoiceSearchBar}
              >
                <span className="px-3" style={{color: '#9CA3AF'}}>
                  <FontAwesomeIcon icon={faSearch} />
                </span>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search invoice ID, customer, status..."
                  className={styles.vendorInvoiceSearchField}
                />
              </div>

              <div className="d-flex align-items-center gap-2">
                {searchTerm ? (
                  <button
                    type="button"
                    className="bg-transparent"
                    onClick={handleClearSearch}
                    style={{
                      minHeight: '40px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: '#78716C',
                      fontSize: '13px',
                      padding: '0 14px'
                    }}
                  >
                    Clear
                  </button>
                ) : null}
                <button
                  type="submit"
                  className={`rounded-3 ${stylesItem.jBtn}`}
                  style={{minHeight: '40px', padding: '0 18px'}}
                >
                  Search
                </button>
              </div>

              {searchTerm ? (
                <small className="w-100" style={{color: '#78716C'}}>
                  Showing {filteredInvoices.length} result{filteredInvoices.length === 1 ? '' : 's'} for "{searchTerm}"
                </small>
              ) : null}
            </form>
            <div className={styles.vendorInvoiceTableWrap}>
            <table className={`table table-borderless ${styles.vendorInvoiceTable}`}>
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
                ) : filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice) => (
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
                              type="button"
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
                                minWidth: '180px'
                              }}>
                                <button
                                  type="button"
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
                                  type="button"
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
                                  type="button"
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
                                  type="button"
                                  onClick={() => handleGenerateReceipt(invoice)}
                                  disabled={generatingReceiptId === invoice.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    fontSize: '13px',
                                    color: generatingReceiptId === invoice.id ? '#9CA3AF' : '#374151',
                                    cursor: generatingReceiptId === invoice.id ? 'not-allowed' : 'pointer',
                                    textAlign: 'left'
                                  }}
                                  onMouseOver={(e) => {
                                    if (generatingReceiptId !== invoice.id) {
                                      e.target.style.backgroundColor = '#F3F4F6';
                                    }
                                  }}
                                  onMouseOut={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <FontAwesomeIcon icon={faReceipt} style={{color: '#8B5CF6'}} />
                                  {generatingReceiptId === invoice.id ? 'Generating...' : 'Generate Receipt'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleGetReceipts(invoice)}
                                  disabled={fetchingReceiptsInvoiceId === invoice.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    fontSize: '13px',
                                    color: fetchingReceiptsInvoiceId === invoice.id ? '#9CA3AF' : '#374151',
                                    cursor: fetchingReceiptsInvoiceId === invoice.id ? 'not-allowed' : 'pointer',
                                    textAlign: 'left'
                                  }}
                                  onMouseOver={(e) => {
                                    if (fetchingReceiptsInvoiceId !== invoice.id) {
                                      e.target.style.backgroundColor = '#F3F4F6';
                                    }
                                  }}
                                  onMouseOut={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <FontAwesomeIcon icon={faReceipt} style={{color: '#0273F9'}} />
                                  {fetchingReceiptsInvoiceId === invoice.id ? 'Loading Receipts...' : 'Get Receipts'}
                                </button>
                                <button
                                  type="button"
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
	                        {searchTerm ? 'No invoices matched your search' : 'No invoices found'}
	                    </td>
	                    </tr>
	                )}
                </tbody>
            </table>
            </div>

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
