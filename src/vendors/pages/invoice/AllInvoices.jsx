import React, { useState, useEffect, useRef } from 'react'
import stylesItem from '../../../Tabs.module.css';
import InvoiceCards from './InvoiceCards';
import { useDispatch, useSelector } from 'react-redux';
import { getAllInvoice } from '../../../slice/invoiceSlice';
import Swal from 'sweetalert2';
import Pagination from '../../../components/Pagination';
import CreateInvoice from '../crm/CreateInvoice';
import InvoiceDetails from './InvoiceDetails';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faEye, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';

const AllInvoices = () => {
  const dispatch = useDispatch();
  let token = localStorage.getItem("token");
  const {loading, error, success, invoiceData } = useSelector((state) => state.invoice);
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState('list'); // 'list', 'create', 'details'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

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
    setSelectedInvoice(invoice);
    // Navigate to update or handle update logic
    setOpenDropdown(null);
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

            <InvoiceCards />

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
                    <td colSpan="6" className="text-center py-4">
                        <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                        </div>
                    </td>
                    </tr>
                ) : invoiceData?.data?.length > 0 ? (
                    invoiceData.data.map((invoice) => (
                    <tr key={invoice.id} style={{borderBottom: '1px solid #eee'}}>
                        <td style={{fontSize: '13px'}}>{invoice.invoice_number || invoice.id}</td>
                        <td style={{fontSize: '13px'}}>{invoice.Customer || '-'}</td>
                        <td style={{fontSize: '13px'}}>₦{invoice.total?.toLocaleString() || '0'}</td>
                        <td style={{fontSize: '13px'}}>{invoice.issue_date}</td>
                        <td style={{fontSize: '13px'}}>{invoice.due_date}</td>
                        {/* <td style={{fontSize: '13px'}}>{invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : '-'}</td> */}
                        <td>
                        <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: invoice.status === 'paid' ? '#DCFCE7' : invoice.status === 'overdue' ? '#FEE2E2' : '#FEF3C7',
                            color: invoice.status === 'paid' ? '#166534' : invoice.status === 'overdue' ? '#991B1B' : '#92400E'
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
                                  <FontAwesomeIcon icon={faPen} style={{color: '#F59E0B'}} /> Update
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
                    <td colSpan="6" className="text-center py-4" style={{color: '#78716C'}}>
                        No invoices found
                    </td>
                    </tr>
                )}
                </tbody>
            </table>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={invoiceData?.pagination?.total_pages || 1}
                onPageChange={handlePageChange}
                itemsPerPage={invoiceData?.pagination?.limit || 20}
                totalItems={invoiceData?.pagination?.total_items || 0}
                disabled={loading}
            />
            </div>
        </>
      ) : view === 'create' ? (
        <CreateInvoice onBack={() => setView('list')} />
      ) : (
        <InvoiceDetails invoice={selectedInvoice} onBack={() => setView('list')} />
      )}
    </>
  )
}

export default AllInvoices