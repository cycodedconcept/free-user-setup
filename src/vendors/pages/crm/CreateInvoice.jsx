import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faEye, faShare, faEnvelope, faArrowLeft, faDownload, faTimes, faPrint } from '@fortawesome/free-solid-svg-icons';
import { createInvoice, resetStatus, updateInvoice } from '../../../slice/invoiceSlice';
import { getMyOnlineStore } from '../../../slice/onlineStoreSlice';
import InvoiceDetails from '../invoice/InvoiceDetails';
import Swal from 'sweetalert2';
import styles from "../../../styles.module.css";

const readStoredItemId = () => {
  const storedItemId = localStorage.getItem("itemId");

  if (!storedItemId) {
    return null;
  }

  try {
    return JSON.parse(storedItemId);
  } catch {
    return storedItemId;
  }
};

const extractCreatedInvoice = (payload) => {
  const responseData = payload?.data ?? payload ?? {};
  const data = responseData?.data ?? {};
  const invoice =
    responseData?.invoice ??
    data?.invoice ??
    data ??
    responseData;
  const previews = data?.previews ?? responseData?.previews ?? [];
  const primaryPreview = Array.isArray(previews) ? previews[0] : null;

  if (!invoice || typeof invoice !== 'object') {
    return null;
  }

  return {
    ...invoice,
    customer: invoice.customer || invoice.Customer || null,
    items: invoice.items || invoice.InvoiceItems || [],
    preview_url:
      invoice.preview_url ||
      primaryPreview?.preview_url ||
      responseData?.preview_url ||
      data?.preview_url ||
      '',
    download_url:
      invoice.download_url ||
      primaryPreview?.pdf_url ||
      primaryPreview?.preview_url ||
      responseData?.download_url ||
      data?.download_url ||
      '',
    pdf_url:
      invoice.pdf_url ||
      primaryPreview?.pdf_url ||
      responseData?.pdf_url ||
      data?.pdf_url ||
      ''
  };
};

const getInvoiceItems = (invoice) => {
  const sourceItems = invoice?.items || invoice?.InvoiceItems || [];

  if (!Array.isArray(sourceItems) || sourceItems.length === 0) {
    return [
      {
        item_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        discount_percentage: 0
      }
    ];
  }

  return sourceItems.map((item) => ({
    item_name: item?.item_name || '',
    description: item?.description || '',
    quantity: Number(item?.quantity || 1),
    unit_price: Number(item?.unit_price || 0),
    discount_percentage: Number(item?.discount_percentage || 0)
  }));
};

const formatCurrencyValue = (value, currency = 'NGN') => {
  const numericValue = Number(value || 0);

  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(numericValue);
  } catch {
    return `${currency} ${numericValue.toFixed(2)}`;
  }
};

const buildInvoiceShareText = (invoice) => {
  const customer = invoice?.customer || invoice?.Customer;
  const customerName =
    typeof customer === 'string'
      ? customer
      : customer?.name || invoice?.customer_name || 'Customer';

  return [
    `Invoice ${invoice?.invoice_number || invoice?.id || ''}`.trim(),
    `Customer: ${customerName}`,
    `Issue Date: ${invoice?.issue_date || '-'}`,
    `Due Date: ${invoice?.due_date || '-'}`,
    `Total: ${formatCurrencyValue(invoice?.total, invoice?.currency || 'NGN')}`
  ].join('\n');
};

const escapePdfText = (value) =>
  String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const buildInvoicePdfBlob = (invoice) => {
  const customer = invoice?.customer || invoice?.Customer;
  const customerName =
    typeof customer === 'string'
      ? customer
      : customer?.name || invoice?.customer_name || 'Customer';
  const customerEmail =
    typeof customer === 'object' && customer !== null
      ? customer.email || ''
      : invoice?.customer_email || '';
  const items = invoice?.items || invoice?.InvoiceItems || [];
  const currency = invoice?.currency || 'NGN';

  const lines = [
    `Invoice ${invoice?.invoice_number || invoice?.id || ''}`.trim(),
    `Status: ${invoice?.status || 'draft'}`,
    `Issue Date: ${invoice?.issue_date || '-'}`,
    `Due Date: ${invoice?.due_date || '-'}`,
    '',
    'Bill To',
    customerName,
    customerEmail || '-',
    '',
    'Items'
  ];

  if (items.length === 0) {
    lines.push('No items');
  } else {
    items.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.item_name || '-'}`,
        `   Description: ${item.description || '-'}`,
        `   Qty: ${item.quantity || 0} | Unit: ${formatCurrencyValue(item.unit_price, currency)} | Discount: ${item.discount_percentage || 0}% | Total: ${formatCurrencyValue(item.total, currency)}`
      );
    });
  }

  lines.push(
    '',
    `Subtotal: ${formatCurrencyValue(invoice?.subtotal, currency)}`,
    `Tax: ${formatCurrencyValue(invoice?.tax_amount, currency)}`,
    `Discount: ${formatCurrencyValue(invoice?.discount_amount, currency)}`,
    `Total: ${formatCurrencyValue(invoice?.total, currency)}`,
    '',
    'Notes'
  );

  const noteLines = String(invoice?.notes || '-').split('\n');
  lines.push(...noteLines);

  const sanitizedLines = lines.map((line) => escapePdfText(line));
  const pageHeight = 792;
  const topMargin = 760;
  const lineHeight = 16;
  const maxLinesPerPage = 42;
  const pages = [];

  for (let index = 0; index < sanitizedLines.length; index += maxLinesPerPage) {
    pages.push(sanitizedLines.slice(index, index + maxLinesPerPage));
  }

  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const fontObjectId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageObjectIds = [];

  pages.forEach((pageLines) => {
    const textCommands = pageLines
      .map((line, index) => `1 0 0 1 50 ${topMargin - index * lineHeight} Tm (${line}) Tj`)
      .join('\n');
    const stream = `BT\n/F1 12 Tf\n${textCommands}\nET`;
    const contentObjectId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const pageObjectId = addObject(
      `<< /Type /Page /Parent PAGES_ID 0 R /MediaBox [0 0 612 ${pageHeight}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`
    );
    pageObjectIds.push(pageObjectId);
  });

  const pagesObjectId = addObject(
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`
  );

  pageObjectIds.forEach((pageObjectId) => {
    objects[pageObjectId - 1] = objects[pageObjectId - 1].replace('PAGES_ID', String(pagesObjectId));
  });

  const catalogObjectId = addObject(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((objectContent, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${objectContent}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
};

const CreateInvoice = ({ onBack, invoice = null, mode = 'create' }) => {
  const dispatch = useDispatch();
  let token = localStorage.getItem("token");
  const storedStoreId = readStoredItemId();
  const onlineStoreId = useSelector((state) => state.store?.myStore?.onlineStore?.id);
  const { loading, error, success } = useSelector((state) => state.invoice);
  const isEditMode = mode === 'edit' && Boolean(invoice?.id);
  const resolvedStoreId = onlineStoreId || storedStoreId || '';

  const [formData, setFormData] = useState({
    issue_date: '',
    due_date: '',
    currency: 'NGN',
    tax_rate: 0,
    discount_amount: 0,
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [createdInvoicePreview, setCreatedInvoicePreview] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [items, setItems] = useState([
    {
      item_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_percentage: 0
    }
  ]);

  useEffect(() => {
    if (!isEditMode || !invoice) {
      return;
    }

    setFormData({
      issue_date: invoice?.issue_date || '',
      due_date: invoice?.due_date || '',
      currency: invoice?.currency || 'NGN',
      tax_rate: Number(invoice?.tax_rate || 0),
      discount_amount: Number(invoice?.discount_amount || 0),
      notes: invoice?.notes || ''
    });
    setItems(getInvoiceItems(invoice));
    setErrors({});
    setCreatedInvoicePreview(extractCreatedInvoice(invoice) || invoice);
  }, [isEditMode, invoice]);

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

  const invoicePreviewUrl =
    createdInvoicePreview?.preview_url || '';
  const invoicePdfUrl =
    createdInvoicePreview?.pdf_url ||
    createdInvoicePreview?.download_url ||
    '';

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

    if (!resolvedStoreId && !isEditMode) {
      Swal.fire({
        icon: 'error',
        title: 'Store Not Found',
        text: 'Unable to find your online store ID. Refresh the store data and try again.',
      });
      return;
    }

    const payload = {
      token,
      issue_date: formData.issue_date,
      due_date: formData.due_date,
      currency: formData.currency,
      items: items,
      tax_rate: parseFloat(formData.tax_rate) || 0,
      discount_amount: parseFloat(formData.discount_amount) || 0,
      notes: formData.notes || ''
    };

    if (isEditMode) {
      dispatch(updateInvoice({
        ...payload,
        id: invoice.id,
        store_id: invoice?.store_id ?? invoice?.online_store_id ?? resolvedStoreId ?? null
      }));
      return;
    }

    dispatch(createInvoice({
      ...payload,
      online_store_id: resolvedStoreId
    }));
  };

  const handleOpenPreview = () => {
    if (!createdInvoicePreview) {
      Swal.fire({
        icon: 'info',
        title: 'No Invoice Preview',
        text: isEditMode ? 'This invoice preview is not available yet.' : 'Create an invoice first to preview it.',
      });
      return;
    }

    setIsPreviewModalOpen(true);
  };

  const handleShareInvoice = async () => {
    if (!createdInvoicePreview) {
      Swal.fire({
        icon: 'info',
        title: 'Share Unavailable',
        text: isEditMode ? 'This invoice cannot be shared yet.' : 'Create an invoice first to share it.',
      });
      return;
    }

    const sharePayload = {
      title: `Invoice ${createdInvoicePreview?.invoice_number || createdInvoicePreview?.id || ''}`.trim(),
      text: buildInvoiceShareText(createdInvoicePreview),
      ...(invoicePdfUrl || invoicePreviewUrl ? { url: invoicePdfUrl || invoicePreviewUrl } : {})
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        return;
      }

      await navigator.clipboard.writeText(
        invoicePdfUrl || invoicePreviewUrl
          ? `${buildInvoiceShareText(createdInvoicePreview)}\n\n${invoicePdfUrl || invoicePreviewUrl}`
          : buildInvoiceShareText(createdInvoicePreview)
      );
      Swal.fire({
        icon: 'success',
        title: 'Copied',
        text: invoicePdfUrl || invoicePreviewUrl
          ? 'Invoice details and link copied to clipboard.'
          : 'Invoice details copied to clipboard.',
      });
    } catch (shareError) {
      if (shareError?.name !== 'AbortError') {
        Swal.fire({
          icon: 'error',
          title: 'Share Failed',
          text: 'Unable to share this invoice right now.',
        });
      }
    }
  };

  const handleDownloadInvoice = () => {
    const downloadUrl = invoicePdfUrl;

    const link = document.createElement('a');

    if (downloadUrl) {
      link.href = downloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = `invoice-${createdInvoicePreview?.invoice_number || createdInvoicePreview?.id || 'preview'}.pdf`;
    } else if (createdInvoicePreview) {
      const blob = buildInvoicePdfBlob(createdInvoicePreview);
      link.href = URL.createObjectURL(blob);
      link.download = `invoice-${createdInvoicePreview?.invoice_number || createdInvoicePreview?.id || 'preview'}.pdf`;
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Download Unavailable',
        text: isEditMode ? 'This invoice cannot be downloaded yet.' : 'Create an invoice first to download it.',
      });
      return;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (!downloadUrl && link.href.startsWith('blob:')) {
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }
  };

  const handlePrintInvoice = () => {
    if (invoicePdfUrl) {
      const printWindow = window.open(invoicePdfUrl, '_blank', 'noopener,noreferrer');

      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.focus();
          printWindow.print();
        });
      }
      return;
    }

    if (!createdInvoicePreview) {
      Swal.fire({
        icon: 'info',
        title: 'Print Unavailable',
        text: isEditMode ? 'This invoice cannot be printed yet.' : 'Create an invoice first to print it.',
      });
      return;
    }

    const printWindow = window.open('', '_blank', 'noopener,noreferrer');

    if (!printWindow) {
      Swal.fire({
        icon: 'error',
        title: 'Print Blocked',
        text: 'Allow popups in your browser to print this invoice.',
      });
      return;
    }

    const pdfBlob = buildInvoicePdfBlob(createdInvoicePreview);
    const pdfUrl = URL.createObjectURL(pdfBlob);
    printWindow.location.href = pdfUrl;
    printWindow.addEventListener('load', () => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    });
  };

  const handleEmailInvoice = () => {
    if (!createdInvoicePreview) {
      Swal.fire({
        icon: 'info',
        title: 'No Invoice Yet',
        text: isEditMode ? 'This invoice cannot be emailed yet.' : 'Create an invoice first before sending it by email.',
      });
      return;
    }

    const customer = createdInvoicePreview?.Customer || createdInvoicePreview?.customer;
    const customerEmail =
      (typeof customer === 'object' && customer !== null ? customer.email : '') ||
      createdInvoicePreview?.customer_email ||
      '';
    const subject = `Invoice ${createdInvoicePreview?.invoice_number || createdInvoicePreview?.id || ''}`.trim();
    const body = invoicePreviewUrl
      ? `Hello,%0D%0A%0D%0APlease view your invoice here: ${encodeURIComponent(invoicePreviewUrl)}`
      : 'Hello,%0D%0A%0D%0APlease find your invoice attached.';

    window.location.href = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${body}`;
  };

  useEffect(() => {
    if (token && !resolvedStoreId) {
      dispatch(getMyOnlineStore({ token }));
    }
  }, [token, resolvedStoreId, dispatch]);

  useEffect(() => {
    if (success) {
      const processedInvoice = extractCreatedInvoice(success);

      if (processedInvoice) {
        setCreatedInvoicePreview(processedInvoice);
        setIsPreviewModalOpen(true);
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: isEditMode ? 'Invoice updated successfully' : 'Invoice created successfully',
        });
      }

      if (!isEditMode) {
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
    }
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.message || (isEditMode ? 'Failed to update invoice' : 'Failed to create invoice'),
      });
    }
    if (success || error) {
      dispatch(resetStatus());
    }
  }, [success, error, dispatch, isEditMode]);

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
      <div className={`${styles.vendorInvoiceCreatePage} p-3`}>
        <div className={`${styles.vendorInvoiceCreateHeader} mb-3`}>
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
              <p className="bx mb-0">{isEditMode ? 'Update Invoice' : 'Create New Invoice'}</p>
              <small className="d-block" style={{color: '#78716C'}}>
                {isEditMode ? 'Update the invoice details below' : 'Fill in the details to create a new invoice'}
              </small>
            </div>
          </div>
          <div className={styles.vendorInvoiceCreateActions}>
            <button
              type="button"
              onClick={handleOpenPreview}
              className="btn"
              style={{padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff', opacity: createdInvoicePreview ? 1 : 0.6}}
              disabled={!createdInvoicePreview}
            >
              <FontAwesomeIcon icon={faEye} className="me-2" />Preview
            </button>
            <button
              type="button"
              onClick={handleShareInvoice}
              className="btn"
              style={{padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff', opacity: createdInvoicePreview ? 1 : 0.6}}
              disabled={!createdInvoicePreview}
            >
              <FontAwesomeIcon icon={faShare} className="me-2" />Share
            </button>
            <button
              type="button"
              onClick={handleEmailInvoice}
              className="btn"
              style={{padding: '8px 16px', backgroundColor: '#0273F9', color: '#fff', borderRadius: '8px', fontSize: '13px', opacity: createdInvoicePreview ? 1 : 0.6}}
              disabled={!createdInvoicePreview}
            >
              <FontAwesomeIcon icon={faEnvelope} className="me-2" />Send Invoice to Email
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          {/* Invoice Details */}
          <div className={`${styles.vendorInvoiceCreateSection} bg-white rounded-3 p-4 mb-4`} style={{border: '1px solid #eee'}}>
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
          <div className={`${styles.vendorInvoiceCreateSection} bg-white rounded-3 p-4 mb-4`} style={{border: '1px solid #eee'}}>
            <div className={`${styles.vendorInvoiceCreateSectionHeader} mb-3`}>
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
              <div key={index} className={`${styles.vendorInvoiceCreateItemCard} p-3 mb-3 rounded-3`} style={{backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB'}}>
                <div className={`${styles.vendorInvoiceCreateItemHeader} mb-2`}>
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
              <div className={`${styles.vendorInvoiceCreateSection} bg-white rounded-3 p-4 h-100`} style={{border: '1px solid #eee'}}>
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
              <div className={`${styles.vendorInvoiceCreateSection} bg-white rounded-3 p-4 h-100`} style={{border: '1px solid #eee'}}>
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
          <div className={styles.vendorInvoiceCreateSubmitRow}>
            <button
              type="button"
              className="btn"
              style={{padding: '10px 24px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px'}}
              onClick={onBack}
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
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditMode ? 'Update Invoice' : 'Create Invoice'
              )}
            </button>
          </div>
        </form>
      </div>

      {isPreviewModalOpen && createdInvoicePreview && (
        <div
          onClick={() => setIsPreviewModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            zIndex: 2000,
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={styles.vendorInvoiceCreateModal}
          >
            <div
              className={`${styles.vendorInvoiceCreateModalHeader} px-4 py-3`}
            >
              <div>
                <h6 className="mb-0">Invoice Preview</h6>
                <small style={{color: '#6B7280'}}>
                  #{createdInvoicePreview?.invoice_number || createdInvoicePreview?.id || 'New Invoice'}
                </small>
              </div>
              <div className={styles.vendorInvoiceCreateModalActions}>
                <button
                  type="button"
                  className="btn"
                  onClick={handleShareInvoice}
                  style={{padding: '8px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff'}}
                >
                  <FontAwesomeIcon icon={faShare} className="me-2" />
                  Share
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handlePrintInvoice}
                  style={{padding: '8px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff'}}
                >
                  <FontAwesomeIcon icon={faPrint} className="me-2" />
                  Print
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleDownloadInvoice}
                  style={{padding: '8px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff'}}
                >
                  <FontAwesomeIcon icon={faDownload} className="me-2" />
                  Download
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsPreviewModalOpen(false)}
                  style={{padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff'}}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>

            <div className={styles.vendorInvoiceCreateModalBody}>
              {invoicePreviewUrl ? (
                <div className="p-4 d-flex justify-content-center">
                  <img
                    src={invoicePreviewUrl}
                    alt={`Invoice ${createdInvoicePreview?.invoice_number || createdInvoicePreview?.id || 'preview'}`}
                    style={{
                      width: '100%',
                      maxWidth: '900px',
                      height: 'auto',
                      borderRadius: '12px',
                      backgroundColor: '#fff',
                      boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)'
                    }}
                  />
                </div>
              ) : (
                <div className="p-4">
                  <InvoiceDetails invoice={createdInvoicePreview} showHeader={false} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CreateInvoice
