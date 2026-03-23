import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faCircleCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../../components/ui/Button";
import stylesItem from "../../../Tabs.module.css";
import {
  createStandaloneReceipt,
  resetCreatedReceipt,
} from "../../../slice/order";
import { getMyOnlineStore } from "../../../slice/onlineStoreSlice";
import { Logo } from "../../../assets";

const resolveStoreInfo = (myStore) =>
  myStore?.onlineStore || myStore?.data?.onlineStore || myStore?.store || {};

const resolveReceiptLogoUrl = (storeInfo, receipt) => {
  const candidate =
    storeInfo?.profile_logo_url ||
    storeInfo?.logo ||
    receipt?.company_logo ||
    Logo;

  if (!candidate) {
    return "";
  }

  if (
    candidate.startsWith("http://") ||
    candidate.startsWith("https://") ||
    candidate.startsWith("data:") ||
    candidate.startsWith("blob:")
  ) {
    return candidate;
  }

  if (typeof window !== "undefined") {
    return new URL(candidate, window.location.origin).href;
  }

  return candidate;
};

const createDraftReceiptNumber = () =>
  `RCT-${String(Math.floor(100000 + Math.random() * 900000))}`;

const formatDateInputValue = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
};

const formatDateDisplay = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB");
};

const formatCurrencyValue = (value, currency = "NGN") => {
  const amount = Number(value || 0);

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const getReceiptNumber = (receipt) =>
  receipt?.receipt_number ||
  receipt?.reference ||
  receipt?.receipt_no ||
  receipt?.number ||
  (receipt?.id ? `RCT-${receipt.id}` : "");

const getReceiptDate = (receipt) =>
  receipt?.receipt_date ||
  receipt?.transaction_date ||
  receipt?.issued_at ||
  receipt?.created_at ||
  receipt?.date ||
  receipt?.payment_date ||
  "";

const getReceiptDocumentUrl = (receipt) =>
  receipt?.pdf_url || receipt?.document_url || receipt?.download_url || "";

const getReceiptPreviewUrl = (receipt) =>
  receipt?.preview_url || receipt?.image_url || "";

const escapeHtml = (value) =>
  `${value ?? ""}`
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const createInitialFormState = () => ({
  receipt_number: createDraftReceiptNumber(),
  receipt_date: formatDateInputValue(),
  customer_name: "",
  customer_email: "",
  customer_phone: "+234",
  payment_date: formatDateInputValue(),
  payment_method: "",
  payment_preference: "",
  description: "",
  notes: "",
  currency: "NGN",
  currency_symbol: "₦",
  publish_product: false,
});

const createInitialReceiptItem = () => ({
  item_name: "",
  quantity: 1,
  unit_price: "",
});

const normalizeReceiptItems = (items) =>
  items.map((item) => {
    const quantity = Number(item?.quantity || 0);
    const unitPrice = Number(item?.unit_price || 0);
    const total = quantity * unitPrice;

    return {
      item_name: `${item?.item_name || ""}`.trim(),
      quantity,
      unit_price: unitPrice,
      price: unitPrice,
      total,
    };
  });

const calculateReceiptItemsTotal = (items) =>
  normalizeReceiptItems(items).reduce(
    (sum, item) => sum + Number(item?.total || 0),
    0
  );

const buildReceiptPayloadFromForm = (formData, items) => {
  return {
    items: normalizeReceiptItems(items),
    currency: formData.currency,
    currency_symbol: formData.currency_symbol,
    payment_method: formData.payment_method.trim(),
    customer_name: formData.customer_name.trim(),
    customer_phone: formData.customer_phone.trim(),
    customer_email: formData.customer_email.trim(),
    notes: formData.notes.trim(),
  };
};

const extractReceiptFromResponse = (payload) => {
  const responseData = payload?.data ?? payload ?? {};
  const data = responseData?.data ?? {};
  const receiptData = data?.receipt_data ?? responseData?.receipt_data ?? {};
  const receipt =
    responseData?.receipt ??
    data?.receipt ??
    (data && !Array.isArray(data) ? data : null) ??
    responseData;
  const previews = data?.previews ?? responseData?.previews ?? [];
  const primaryPreview = Array.isArray(previews) ? previews[0] : null;

  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    return {};
  }

  return {
    ...(receiptData && typeof receiptData === "object" ? receiptData : {}),
    ...receipt,
    preview_url:
      receipt?.preview_url ||
      primaryPreview?.preview_url ||
      responseData?.preview_url ||
      data?.preview_url ||
      "",
    pdf_url:
      receipt?.pdf_url ||
      receipt?.document_url ||
      primaryPreview?.pdf_url ||
      responseData?.pdf_url ||
      data?.pdf_url ||
      "",
    download_url:
      receipt?.download_url ||
      receipt?.document_url ||
      primaryPreview?.pdf_url ||
      responseData?.download_url ||
      data?.download_url ||
      "",
  };
};

const buildReceiptViewData = (receipt, formData, inputItems) => {
  const resolvedItems = Array.isArray(receipt?.items) && receipt.items.length
    ? receipt.items
    : normalizeReceiptItems(inputItems);
  const amountFromItems = resolvedItems.reduce(
    (sum, item) => sum + Number(item?.total || item?.price || 0),
    0
  );

  return {
    ...receipt,
    receipt_number: getReceiptNumber(receipt) || formData.receipt_number,
    receipt_date: getReceiptDate(receipt) || formData.receipt_date,
    amount_received:
      Number(
        receipt?.amount_received ??
          receipt?.amount ??
          receipt?.paid_amount ??
          receipt?.total ??
          amountFromItems ??
          calculateReceiptItemsTotal(inputItems)
      ) || 0,
    payment_date: receipt?.payment_date || formData.payment_date,
    payment_method: receipt?.payment_method || formData.payment_method,
    payment_preference:
      receipt?.payment_preference || formData.payment_preference,
    customer_name: receipt?.customer_name || formData.customer_name,
    customer_email:
      receipt?.customer_email || receipt?.receipt_data?.customer_email || formData.customer_email,
    customer_phone:
      receipt?.customer_phone || receipt?.receipt_data?.customer_phone || formData.customer_phone,
    description:
      receipt?.description ||
      receipt?.item_description ||
      formData.description,
    notes: receipt?.notes || formData.notes,
    currency: receipt?.currency || formData.currency,
    currency_symbol: receipt?.currency_symbol || formData.currency_symbol,
    preview_url: getReceiptPreviewUrl(receipt),
    document_url: getReceiptDocumentUrl(receipt),
    items: resolvedItems,
  };
};

const buildReceiptHtmlMarkup = (receipt, storeInfo) => {
  const storeName =
    receipt?.company_name || storeInfo?.store_name || "Mycroshop";
  const storeAddress =
    storeInfo?.address ||
    storeInfo?.store_address ||
    storeInfo?.business_address ||
    "-";
  const storeEmail =
    storeInfo?.email ||
    storeInfo?.store_email ||
    storeInfo?.business_email ||
    "-";
  const storeWebsite =
    storeInfo?.website || storeInfo?.storefront_link || "www.mycroshop.com";
  const storePhone =
    storeInfo?.phone || storeInfo?.phone_number || storeInfo?.contact_number || "-";
  const logoUrl = resolveReceiptLogoUrl(storeInfo, receipt);
  const itemRows = (receipt?.items || [])
    .map(
      (item) => `
        <div class="row">
          <span>${escapeHtml(item?.item_name || "-")} x ${escapeHtml(
            Number(item?.quantity || 0)
          )}</span>
          <span>${escapeHtml(
            formatCurrencyValue(item?.total || item?.price || 0, receipt?.currency)
          )}</span>
        </div>
      `
    )
    .join("");

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(receipt?.receipt_number || "Receipt")}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 32px 18px;
          font-family: Poppins, Arial, sans-serif;
          background: #f5f8fc;
          color: #1f2937;
        }
        .sheet {
          max-width: 760px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
        }
        .hero {
          padding: 28px 32px;
          background: #eaf4ff;
          text-align: center;
        }
        .logo {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 999px;
          border: 4px solid #ffffff;
          background: #ffffff;
          display: block;
          margin: 0 auto 12px;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.12);
        }
        .hero h1 {
          margin: 10px 0 0;
          font-size: 34px;
        }
        .section {
          padding: 24px 32px;
        }
        .divider {
          border-top: 1px dashed #dbe3ef;
        }
        .row {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .muted { color: #6b7280; }
        .card {
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 18px;
          margin-top: 18px;
        }
        .card .row:last-child {
          margin-bottom: 0;
        }
        .amount {
          font-size: 22px;
          font-weight: 700;
        }
        .footer {
          text-align: center;
          padding: 0 32px 28px;
          color: #6b7280;
        }
        @media print {
          body {
            background: #fff;
            padding: 0;
          }
          .sheet {
            box-shadow: none;
            border: none;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <main class="sheet">
        <section class="hero">
          ${logoUrl ? `<img class="logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(storeName)} logo" />` : ""}
          <div>${escapeHtml(storeName)}</div>
          <h1>RECEIPT</h1>
        </section>

        <section class="section">
          <div class="row"><span class="muted">Business Address</span><span>${escapeHtml(storeAddress)}</span></div>
          <div class="row"><span class="muted">Business Email</span><span>${escapeHtml(storeEmail)}</span></div>
          <div class="row"><span class="muted">Website</span><span>${escapeHtml(storeWebsite)}</span></div>
          <div class="row"><span class="muted">Phone Number</span><span>${escapeHtml(storePhone)}</span></div>
        </section>

        <div class="divider"></div>

        <section class="section">
          <div class="row">
            <span>Receipt No: ${escapeHtml(receipt?.receipt_number)}</span>
            <span>Date: ${escapeHtml(formatDateDisplay(receipt?.receipt_date))}</span>
          </div>

          <div class="card">
            <div class="row"><span class="muted">Received From</span><span>${escapeHtml(receipt?.customer_name)}</span></div>
          </div>

          <div class="card">
            <div class="row"><span class="muted">Amount Received</span><span class="amount">${escapeHtml(formatCurrencyValue(receipt?.amount_received, receipt?.currency))}</span></div>
            <div class="row"><span class="muted">Currency</span><span>${escapeHtml(receipt?.currency)}</span></div>
            <div class="row"><span class="muted">Payment Method</span><span>${escapeHtml(receipt?.payment_method || "-")}</span></div>
            <div class="row"><span class="muted">Payment Preference</span><span>${escapeHtml(receipt?.payment_preference || "-")}</span></div>
            <div class="row"><span class="muted">Payment Date</span><span>${escapeHtml(formatDateDisplay(receipt?.payment_date))}</span></div>
          </div>

          ${
            itemRows
              ? `<div class="card">
            <div class="row"><span class="muted">Items</span><span></span></div>${itemRows}
          </div>`
              : ""
          }

          <div class="card">
            <div class="row"><span class="muted">Description</span><span>${escapeHtml(receipt?.description || "-")}</span></div>
            <div class="row"><span class="muted">Note</span><span>${escapeHtml(receipt?.notes || "-")}</span></div>
          </div>
        </section>

        <div class="footer">
          <p>Thank you.</p>
          <p>${escapeHtml(storeWebsite)}</p>
        </div>
      </main>
    </body>
  </html>`;
};

const ReceiptModal = ({
  title,
  onClose,
  children,
  footer,
  width = 680,
  showHeader = true,
}) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.52)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      zIndex: 1200,
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: `${width}px`,
        maxHeight: "92vh",
        overflowY: "auto",
        background: "#FFFFFF",
        borderRadius: "16px",
        boxShadow: "0 24px 80px rgba(15, 23, 42, 0.16)",
      }}
    >
      {showHeader && (
        <div
          className="d-flex justify-content-between align-items-center"
          style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}
        >
          <h4
            className="mb-0"
            style={{ fontSize: "18px", fontWeight: 600, color: "#1C1917" }}
          >
            {title}
          </h4>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#374151",
              fontSize: "20px",
              padding: 0,
            }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}

      <div style={{ padding: showHeader ? "24px" : "0" }}>{children}</div>

      {footer && (
        <div
          className="d-flex justify-content-end gap-2"
          style={{ padding: "0 24px 24px" }}
        >
          {footer}
        </div>
      )}
    </div>
  </div>
);

const SummarySection = ({ title, rows }) => (
  <section style={{ marginBottom: "22px" }}>
    <h5
      style={{
        fontSize: "16px",
        fontWeight: 600,
        color: "#1C1917",
        marginBottom: "14px",
      }}
    >
      {title}
    </h5>
    <div
      style={{
        border: "1px solid #F1F5F9",
        borderRadius: "14px",
        background: "#FFFFFF",
        padding: "18px 16px",
      }}
    >
      {rows.map((row, index) => (
        <div
          key={`${title}-${row.label}-${index}`}
          className="d-flex justify-content-between gap-3"
          style={{
            paddingBottom: index === rows.length - 1 ? 0 : "16px",
            marginBottom: index === rows.length - 1 ? 0 : "16px",
            borderBottom: index === rows.length - 1 ? "none" : "1px solid #F3F4F6",
          }}
        >
          <span style={{ color: "#78716C", fontSize: "14px" }}>{row.label}</span>
          <span
            style={{
              color: "#1C1917",
              fontSize: "14px",
              fontWeight: row.emphasis ? 600 : 500,
              textAlign: "right",
            }}
          >
            {row.value || "-"}
          </span>
        </div>
      ))}
    </div>
  </section>
);

const CreateReceiptView = ({ onBack, onCreated }) => {
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const { createReceiptLoading, createReceiptError } = useSelector(
    (state) => state.order
  );
  const myStore = useSelector((state) => state.store?.myStore);
  const storeInfo = resolveStoreInfo(myStore);

  const [formData, setFormData] = useState(createInitialFormState);
  const [items, setItems] = useState([createInitialReceiptItem()]);
  const [errors, setErrors] = useState({});
  const [createdReceipt, setCreatedReceipt] = useState(null);
  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showPrintSuccessModal, setShowPrintSuccessModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    if (token && !storeInfo?.id) {
      dispatch(getMyOnlineStore({ token }));
    }
  }, [dispatch, storeInfo?.id, token]);

  useEffect(() => {
    return () => {
      dispatch(resetCreatedReceipt());
    };
  }, [dispatch]);

  const receiptViewData = createdReceipt || null;
  const calculatedAmountReceived = calculateReceiptItemsTotal(items);
  const receiptLogoUrl = resolveReceiptLogoUrl(storeInfo, receiptViewData);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    const emailValue = formData.customer_email.trim();
    const itemErrors = items.map((item) => {
      const nextItemError = {};

      if (!`${item?.item_name || ""}`.trim()) {
        nextItemError.item_name = "Item name is required.";
      }

      if (Number(item?.quantity || 0) <= 0) {
        nextItemError.quantity = "Quantity must be greater than zero.";
      }

      if (Number(item?.unit_price || 0) <= 0) {
        nextItemError.unit_price = "Unit price must be greater than zero.";
      }

      return nextItemError;
    });

    if (!formData.customer_name.trim()) {
      nextErrors.customer_name = "Customer name is required.";
    }

    if (!emailValue) {
      nextErrors.customer_email = "Customer email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      nextErrors.customer_email = "Enter a valid email address.";
    }

    if (!formData.customer_phone.trim()) {
      nextErrors.customer_phone = "Customer phone is required.";
    }

    if (!Number.isFinite(calculatedAmountReceived) || calculatedAmountReceived <= 0) {
      nextErrors.amount_received = "Amount received must be greater than zero.";
    }

    if (!formData.payment_date) {
      nextErrors.payment_date = "Payment date is required.";
    }

    if (!formData.payment_method.trim()) {
      nextErrors.payment_method = "Payment method is required.";
    }

    if (!formData.description.trim()) {
      nextErrors.description = "Describe what this payment is for.";
    }

    if (itemErrors.some((itemError) => Object.keys(itemError).length > 0)) {
      nextErrors.items = itemErrors;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );

    if (errors.items?.[index]?.[field]) {
      setErrors((prev) => ({
        ...prev,
        items: (prev.items || []).map((itemError, itemIndex) =>
          itemIndex === index
            ? {
                ...itemError,
                [field]: "",
              }
            : itemError
        ),
      }));
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, createInitialReceiptItem()]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => {
      if (prev.length === 1) {
        return prev;
      }

      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm() || !token) {
      return;
    }

    dispatch(resetCreatedReceipt());

    const payload = buildReceiptPayloadFromForm(formData, items);
    const action = await dispatch(
      createStandaloneReceipt({
        token,
        ...payload,
      })
    );

    if (createStandaloneReceipt.rejected.match(action)) {
      return;
    }

    const nextReceipt = extractReceiptFromResponse(action.payload);
    const nextReceiptViewData = buildReceiptViewData(nextReceipt, formData, items);

    setCreatedReceipt(nextReceiptViewData);
    setFormData(createInitialFormState());
    setItems([createInitialReceiptItem()]);
    setErrors({});
    setShowCreatedModal(true);
    onCreated?.(nextReceiptViewData);
  };

  const handleBack = () => {
    dispatch(resetCreatedReceipt());
    onBack?.();
  };

  const handleSendEmail = () => {
    if (!receiptViewData) {
      return;
    }

    const subject = `Receipt ${receiptViewData.receipt_number}`.trim();
    const receiptUrl =
      receiptViewData.document_url || receiptViewData.preview_url || "";
    const body = [
      `Hello ${receiptViewData.customer_name || ""},`,
      "",
      `Your receipt ${receiptViewData.receipt_number} is ready.`,
      receiptUrl ? `View receipt: ${receiptUrl}` : "",
      "",
      "Thank you.",
    ]
      .filter(Boolean)
      .join("\n");

    window.location.href = `mailto:${encodeURIComponent(
      receiptViewData.customer_email || ""
    )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleDownloadReceipt = () => {
    if (!receiptViewData) {
      return;
    }

    const documentUrl = receiptViewData.document_url || receiptViewData.preview_url;
    const link = document.createElement("a");

    if (documentUrl) {
      link.href = documentUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = `receipt-${receiptViewData.receipt_number || "download"}.pdf`;
    } else {
      const htmlBlob = new Blob(
        [buildReceiptHtmlMarkup(receiptViewData, storeInfo)],
        { type: "text/html;charset=utf-8" }
      );

      link.href = URL.createObjectURL(htmlBlob);
      link.download = `receipt-${receiptViewData.receipt_number || "download"}.html`;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (!documentUrl && link.href.startsWith("blob:")) {
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }
  };

  const inputStyle = {
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "13px 14px",
    fontSize: "14px",
    width: "100%",
    background: "#FFFFFF",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: "14px",
    color: "#1C1917",
    marginBottom: "8px",
    fontWeight: 500,
  };

  const renderInputStyle = (field) => ({
    ...inputStyle,
    borderColor: errors[field] ? "#DC2626" : "#E5E7EB",
  });

  return (
    <>
      <div>
        <Button
          unstyled
          onClick={handleBack}
          style={{
            color: "var(--app-text)",
            fontSize: "15px",
            marginBottom: "10px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: 0,
            border: "none",
            background: "transparent",
          }}
        >
          <span
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "999px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
            }}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </span>
          Back to Receipt
        </Button>

        <h4
          className="mb-4"
          style={{ color: "var(--app-text)", fontWeight: 700, fontSize: "20px" }}
        >
          Create Receipt
        </h4>

        <form onSubmit={handleSubmit}>
          <div
            className="card shadow-sm mb-4"
            style={{ border: "1px solid #EEEEEE", borderRadius: "14px", overflow: "hidden" }}
          >
            <div className="card-body p-0">
              <div className="p-4">
                <h5 className="mb-0" style={{ fontSize: "18px", fontWeight: 600 }}>
                  Receipt Information
                </h5>
              </div>
              <hr className="m-0" />
              <div className="p-4">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label style={labelStyle}>
                      Receipt Number <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.receipt_number}
                      readOnly
                      className={`form-control ${stylesItem["input-item"]}`}
                      style={{ ...inputStyle, background: "#F8FAFC", color: "#78716C" }}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label style={labelStyle}>Date</label>
                    <input
                      type="date"
                      value={formData.receipt_date}
                      onChange={(event) =>
                        handleFieldChange("receipt_date", event.target.value)
                      }
                      style={renderInputStyle("receipt_date")}
                    />
                  </div>
                </div>

                <div
                  className="d-flex flex-wrap gap-2 align-items-center"
                  style={{ marginTop: "18px", color: "#78716C", fontSize: "14px" }}
                >
                  <span style={{ color: "#1C1917", fontWeight: 500 }}>Invoice Link:</span>
                  <span>No invoice link</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="card shadow-sm mb-4"
            style={{ border: "1px solid #EEEEEE", borderRadius: "14px", overflow: "hidden" }}
          >
            <div className="card-body p-0">
              <div className="p-4">
                <h5 className="mb-0" style={{ fontSize: "18px", fontWeight: 600 }}>
                  Customer Details
                </h5>
              </div>
              <hr className="m-0" />
              <div className="p-4">
                <div className="mb-3">
                  <label style={labelStyle}>
                    Customer Name <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(event) =>
                      handleFieldChange("customer_name", event.target.value)
                    }
                    placeholder="Enter customer name"
                    style={renderInputStyle("customer_name")}
                  />
                  {errors.customer_name && (
                    <div style={{ color: "#DC2626", fontSize: "12px", marginTop: "6px" }}>
                      {errors.customer_name}
                    </div>
                  )}
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label style={labelStyle}>
                      Customer Email <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.customer_email}
                      onChange={(event) =>
                        handleFieldChange("customer_email", event.target.value)
                      }
                      placeholder="example@email.com"
                      style={renderInputStyle("customer_email")}
                    />
                    {errors.customer_email && (
                      <div style={{ color: "#DC2626", fontSize: "12px", marginTop: "6px" }}>
                        {errors.customer_email}
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <label style={labelStyle}>
                      Customer Phone <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.customer_phone}
                      onChange={(event) =>
                        handleFieldChange("customer_phone", event.target.value)
                      }
                      placeholder="+234"
                      style={renderInputStyle("customer_phone")}
                    />
                    {errors.customer_phone && (
                      <div style={{ color: "#DC2626", fontSize: "12px", marginTop: "6px" }}>
                        {errors.customer_phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="card shadow-sm mb-4"
            style={{ border: "1px solid #EEEEEE", borderRadius: "14px", overflow: "hidden" }}
          >
            <div className="card-body p-0">
              <div className="p-4">
                <h5 className="mb-0" style={{ fontSize: "18px", fontWeight: 600 }}>
                  Payment Details
                </h5>
              </div>
              <hr className="m-0" />
              <div className="p-4">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label style={labelStyle}>
                      Amount Received <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      type="number"
                      value={calculatedAmountReceived || ""}
                      readOnly
                      placeholder="0.00"
                      style={{
                        ...renderInputStyle("amount_received"),
                        background: "#F8FAFC",
                        color: "#78716C",
                      }}
                    />
                    <small style={{ color: "#78716C", fontSize: "12px", marginTop: "6px", display: "block" }}>
                      Calculated from the receipt items below.
                    </small>
                    {errors.amount_received && (
                      <div style={{ color: "#DC2626", fontSize: "12px", marginTop: "6px" }}>
                        {errors.amount_received}
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <label style={labelStyle}>
                      Date <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.payment_date}
                      onChange={(event) =>
                        handleFieldChange("payment_date", event.target.value)
                      }
                      style={renderInputStyle("payment_date")}
                    />
                    {errors.payment_date && (
                      <div style={{ color: "#DC2626", fontSize: "12px", marginTop: "6px" }}>
                        {errors.payment_date}
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <label style={labelStyle}>
                      Payment Method <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(event) =>
                        handleFieldChange("payment_method", event.target.value)
                      }
                      style={renderInputStyle("payment_method")}
                    >
                      <option value="">Select Payment Method</option>
                      <option value="Cash">Cash</option>
                      <option value="Transfer">Transfer</option>
                      <option value="Card">Card</option>
                      <option value="POS">POS</option>
                    </select>
                    {errors.payment_method && (
                      <div style={{ color: "#DC2626", fontSize: "12px", marginTop: "6px" }}>
                        {errors.payment_method}
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <label style={labelStyle}>Payment Preference</label>
                    <input
                      type="text"
                      value={formData.payment_preference}
                      onChange={(event) =>
                        handleFieldChange("payment_preference", event.target.value)
                      }
                      placeholder="e.g. Transfer"
                      style={renderInputStyle("payment_preference")}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label style={labelStyle}>
                    What was this Payment for? <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <textarea
                    rows="4"
                    value={formData.description}
                    onChange={(event) =>
                      handleFieldChange("description", event.target.value)
                    }
                    placeholder="e.g., Purchase of 3 T-shirts and 1 cap"
                    style={{ ...renderInputStyle("description"), resize: "vertical" }}
                  />
                  {errors.description && (
                    <div style={{ color: "#DC2626", fontSize: "12px", marginTop: "6px" }}>
                      {errors.description}
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <label style={labelStyle}>Notes</label>
                  <textarea
                    rows="3"
                    value={formData.notes}
                    onChange={(event) => handleFieldChange("notes", event.target.value)}
                    placeholder="Thank you for your purchase!"
                    style={{ ...renderInputStyle("notes"), resize: "vertical" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className="card shadow-sm mb-4"
            style={{ border: "1px solid #EEEEEE", borderRadius: "14px", overflow: "hidden" }}
          >
            <div className="card-body p-0">
              <div className="p-4 d-flex justify-content-between align-items-center gap-3">
                <h5 className="mb-0" style={{ fontSize: "18px", fontWeight: 600 }}>
                  Receipt Items
                </h5>
                <Button
                  type="button"
                  unstyled
                  onClick={handleAddItem}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #D6E8FF",
                    background: "#EBF4FF",
                    color: "#0273F9",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Add Item
                </Button>
              </div>
              <hr className="m-0" />
              <div className="p-4">
                {items.map((item, index) => {
                  const itemTotal =
                    Number(item?.quantity || 0) * Number(item?.unit_price || 0);

                  return (
                    <div
                      key={`receipt-item-${index}`}
                      style={{
                        border: "1px solid #E5E7EB",
                        borderRadius: "14px",
                        padding: "16px",
                        marginBottom: index === items.length - 1 ? 0 : "16px",
                        background: "#FAFAFA",
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#1C1917" }}>
                          Item {index + 1}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#DC2626",
                              fontSize: "14px",
                              fontWeight: 500,
                              padding: 0,
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="row g-3">
                        <div className="col-12 col-md-5">
                          <label style={labelStyle}>
                            Item Name <span style={{ color: "#DC2626" }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={item.item_name}
                            onChange={(event) =>
                              handleItemChange(index, "item_name", event.target.value)
                            }
                            placeholder="Product A"
                            style={{
                              ...inputStyle,
                              borderColor:
                                errors.items?.[index]?.item_name ? "#DC2626" : "#E5E7EB",
                            }}
                          />
                          {errors.items?.[index]?.item_name && (
                            <div
                              style={{ color: "#DC2626", fontSize: "12px", marginTop: "6px" }}
                            >
                              {errors.items[index].item_name}
                            </div>
                          )}
                        </div>

                        <div className="col-12 col-md-2">
                          <label style={labelStyle}>
                            Qty <span style={{ color: "#DC2626" }}>*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(event) =>
                              handleItemChange(index, "quantity", event.target.value)
                            }
                            style={{
                              ...inputStyle,
                              borderColor:
                                errors.items?.[index]?.quantity ? "#DC2626" : "#E5E7EB",
                            }}
                          />
                          {errors.items?.[index]?.quantity && (
                            <div
                              style={{ color: "#DC2626", fontSize: "12px", marginTop: "6px" }}
                            >
                              {errors.items[index].quantity}
                            </div>
                          )}
                        </div>

                        <div className="col-12 col-md-3">
                          <label style={labelStyle}>
                            Unit Price <span style={{ color: "#DC2626" }}>*</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(event) =>
                              handleItemChange(index, "unit_price", event.target.value)
                            }
                            placeholder="50.00"
                            style={{
                              ...inputStyle,
                              borderColor:
                                errors.items?.[index]?.unit_price ? "#DC2626" : "#E5E7EB",
                            }}
                          />
                          {errors.items?.[index]?.unit_price && (
                            <div
                              style={{ color: "#DC2626", fontSize: "12px", marginTop: "6px" }}
                            >
                              {errors.items[index].unit_price}
                            </div>
                          )}
                        </div>

                        <div className="col-12 col-md-2">
                          <label style={labelStyle}>Total</label>
                          <input
                            type="text"
                            value={itemTotal ? itemTotal.toFixed(2) : ""}
                            readOnly
                            placeholder="0.00"
                            style={{
                              ...inputStyle,
                              background: "#F8FAFC",
                              color: "#78716C",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className="card shadow-sm mb-4"
            style={{ border: "1px solid #EEEEEE", borderRadius: "14px", overflow: "hidden" }}
          >
            <div className="card-body p-0">
              <div className="p-4">
                <h5 className="mb-0" style={{ fontSize: "18px", fontWeight: 600 }}>
                  Publishing
                </h5>
              </div>
              <hr className="m-0" />
              <div className="p-4">
                <label
                  className="d-flex align-items-center justify-content-between"
                  style={{ cursor: "pointer", gap: "16px" }}
                >
                  <span style={{ color: "#1C1917", fontSize: "15px" }}>
                    Publish Product
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.publish_product}
                    onChange={(event) =>
                      handleFieldChange("publish_product", event.target.checked)
                    }
                    style={{ width: "18px", height: "18px" }}
                  />
                </label>
              </div>
            </div>
          </div>

          {createReceiptError && (
            <div
              className="rounded-3 mb-3"
              style={{
                border: "1px solid #FECACA",
                background: "#FEF2F2",
                color: "#B91C1C",
                padding: "12px 14px",
                fontSize: "14px",
              }}
            >
              {createReceiptError?.message ||
                createReceiptError?.error ||
                "Unable to create receipt right now."}
            </div>
          )}

          <div className="d-flex justify-content-end gap-2">
            <Button
              type="button"
              unstyled
              onClick={handleBack}
              style={{
                padding: "12px 20px",
                borderRadius: "10px",
                border: "1px solid #D6E8FF",
                background: "#EBF4FF",
                color: "#0273F9",
                fontSize: "15px",
                fontWeight: 500,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="blueButton"
              size="md"
              disabled={createReceiptLoading}
              style={{ borderRadius: "10px", minWidth: "190px" }}
            >
              {createReceiptLoading ? "Saving..." : "Save & Issue Receipt"}
            </Button>
          </div>
        </form>
      </div>

      {showCreatedModal && receiptViewData && (
        <ReceiptModal
          title=""
          onClose={() => setShowCreatedModal(false)}
          width={390}
          showHeader={false}
          footer={
            <>
              <Button
                unstyled
                onClick={handleBack}
                style={{
                  minWidth: "160px",
                  padding: "13px 18px",
                  borderRadius: "10px",
                  border: "1px solid #D6E8FF",
                  background: "#EBF4FF",
                  color: "#0273F9",
                  fontSize: "15px",
                  fontWeight: 500,
                }}
              >
                Back to Receipt
              </Button>
              <Button
                variant="blueButton"
                onClick={() => {
                  setShowCreatedModal(false);
                  setShowSummaryModal(true);
                }}
                style={{ minWidth: "160px", padding: "13px 18px", borderRadius: "10px" }}
              >
                View Receipt
              </Button>
            </>
          }
        >
          <div className="text-center" style={{ paddingTop: "10px" }}>
            <FontAwesomeIcon
              icon={faCircleCheck}
              style={{ color: "#34A853", fontSize: "60px", marginBottom: "18px" }}
            />
            <h4
              style={{
                fontSize: "18px",
                color: "#1C1917",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              Receipt Created Successfully
            </h4>
            <p style={{ color: "#78716C", marginBottom: 0 }}>
              Receipt <strong>{receiptViewData.receipt_number}</strong> issued
            </p>
          </div>
        </ReceiptModal>
      )}

      {showSummaryModal && receiptViewData && (
        <ReceiptModal
          title="Receipt Summary"
          onClose={() => setShowSummaryModal(false)}
          width={700}
          footer={
            <>
              <Button
                unstyled
                onClick={handleSendEmail}
                style={{
                  minWidth: "130px",
                  padding: "13px 18px",
                  borderRadius: "10px",
                  border: "1px solid #D6E8FF",
                  background: "#EBF4FF",
                  color: "#0273F9",
                  fontSize: "15px",
                  fontWeight: 500,
                }}
              >
                Send Via Email
              </Button>
              <Button
                variant="blueButton"
                onClick={() => {
                  setShowSummaryModal(false);
                  setShowPrintSuccessModal(true);
                }}
                style={{ minWidth: "130px", padding: "13px 18px", borderRadius: "10px" }}
              >
                Print Receipt
              </Button>
            </>
          }
        >
          <SummarySection
            title="Receipt Information"
            rows={[
              { label: "Receipt Number:", value: receiptViewData.receipt_number },
              { label: "Receipt Date:", value: formatDateDisplay(receiptViewData.receipt_date) },
              {
                label: "Amount Received:",
                value: formatCurrencyValue(
                  receiptViewData.amount_received,
                  receiptViewData.currency
                ),
                emphasis: true,
              },
              { label: "Payment Method:", value: receiptViewData.payment_method },
              {
                label: "Payment Preference:",
                value: receiptViewData.payment_preference || "-",
              },
              {
                label: "Items:",
                value: `${receiptViewData.items?.length || 0}`,
              },
            ]}
          />

          <SummarySection
            title="Customer Information"
            rows={[
              { label: "Customer Name:", value: receiptViewData.customer_name },
              { label: "Email:", value: receiptViewData.customer_email },
              { label: "Phone:", value: receiptViewData.customer_phone },
            ]}
          />

          <SummarySection
            title="Source"
            rows={[
              { label: "Receipt Type:", value: "Standalone receipt - No invoice link" },
              { label: "Description", value: receiptViewData.description },
            ]}
          />

          <SummarySection
            title="Payment & Message Information"
            rows={[
              {
                label: "Amount Received:",
                value: formatCurrencyValue(
                  receiptViewData.amount_received,
                  receiptViewData.currency
                ),
              },
              {
                label: "Payment Date:",
                value: formatDateDisplay(receiptViewData.payment_date),
              },
              {
                label: "Customer-facing message:",
                value: receiptViewData.notes || "Thank you for your payment",
              },
              {
                label: "Internal Note:",
                value: receiptViewData.notes || "-",
              },
            ]}
          />
        </ReceiptModal>
      )}

      {showPrintSuccessModal && receiptViewData && (
        <ReceiptModal
          title=""
          onClose={() => setShowPrintSuccessModal(false)}
          width={390}
          showHeader={false}
          footer={
            <>
              <Button
                unstyled
                onClick={() => setShowPrintSuccessModal(false)}
                style={{
                  minWidth: "140px",
                  padding: "13px 18px",
                  borderRadius: "10px",
                  border: "1px solid #D6E8FF",
                  background: "#EBF4FF",
                  color: "#0273F9",
                  fontSize: "15px",
                  fontWeight: 500,
                }}
              >
                Close
              </Button>
              <Button
                variant="blueButton"
                onClick={() => {
                  setShowPrintSuccessModal(false);
                  setShowReceiptModal(true);
                }}
                style={{ minWidth: "140px", padding: "13px 18px", borderRadius: "10px" }}
              >
                Open Receipt
              </Button>
            </>
          }
        >
          <div className="text-center" style={{ paddingTop: "10px" }}>
            <FontAwesomeIcon
              icon={faCircleCheck}
              style={{ color: "#34A853", fontSize: "60px", marginBottom: "18px" }}
            />
            <h4
              style={{
                fontSize: "18px",
                color: "#1C1917",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              Receipt Ready
            </h4>
            <p style={{ color: "#78716C", marginBottom: 0 }}>
              Open the receipt template to review and download it.
            </p>
          </div>
        </ReceiptModal>
      )}

      {showReceiptModal && receiptViewData && (
        <ReceiptModal
          title="Receipt"
          onClose={() => setShowReceiptModal(false)}
          width={660}
          footer={
            <>
              <Button
                unstyled
                onClick={() => setShowReceiptModal(false)}
                style={{
                  minWidth: "110px",
                  padding: "13px 18px",
                  borderRadius: "10px",
                  border: "1px solid #D6E8FF",
                  background: "#EBF4FF",
                  color: "#0273F9",
                  fontSize: "15px",
                  fontWeight: 500,
                }}
              >
                Close
              </Button>
              <Button
                variant="blueButton"
                onClick={handleDownloadReceipt}
                style={{ minWidth: "170px", padding: "13px 18px", borderRadius: "10px" }}
              >
                Download Receipt
              </Button>
            </>
          }
        >
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "22px",
              overflow: "hidden",
              boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
            }}
          >
            <div
              className="text-center"
              style={{ background: "#EAF4FF", padding: "28px 18px 24px" }}
            >
              {receiptLogoUrl ? (
                <img
                  src={receiptLogoUrl}
                  alt={`${receiptViewData?.company_name || storeInfo?.store_name || "Mycroshop"} logo`}
                  style={{
                    width: "118px",
                    height: "118px",
                    objectFit: "cover",
                    borderRadius: "999px",
                    border: "4px solid #FFFFFF",
                    background: "#FFFFFF",
                    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.12)",
                    marginBottom: "12px",
                  }}
                />
              ) : null}
              <div style={{ fontWeight: 600, color: "#1C1917", marginBottom: "8px" }}>
                {receiptViewData?.company_name || storeInfo?.store_name || "Mycroshop"}
              </div>
              <h3 className="mb-0" style={{ fontSize: "28px", fontWeight: 700 }}>
                RECEIPT
              </h3>
            </div>

            <div style={{ padding: "24px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "10px 16px",
                  color: "#1C1917",
                  fontSize: "14px",
                  marginBottom: "18px",
                }}
              >
                <span style={{ color: "#78716C" }}>Business Address</span>
                <span style={{ textAlign: "right" }}>
                  {storeInfo?.address ||
                    storeInfo?.store_address ||
                    storeInfo?.business_address ||
                    "-"}
                </span>
                <span style={{ color: "#78716C" }}>Business Email</span>
                <span style={{ textAlign: "right" }}>
                  {storeInfo?.email ||
                    storeInfo?.store_email ||
                    storeInfo?.business_email ||
                    "-"}
                </span>
                <span style={{ color: "#78716C" }}>Website</span>
                <span style={{ textAlign: "right" }}>
                  {storeInfo?.website || storeInfo?.storefront_link || "www.mycroshop.com"}
                </span>
                <span style={{ color: "#78716C" }}>Phone Number</span>
                <span style={{ textAlign: "right" }}>
                  {storeInfo?.phone ||
                    storeInfo?.phone_number ||
                    storeInfo?.contact_number ||
                    "-"}
                </span>
              </div>

              <div style={{ borderTop: "1px dashed #DDE3EC", paddingTop: "18px" }}>
                <div className="d-flex justify-content-between gap-3 mb-3">
                  <span style={{ color: "#1C1917", fontSize: "14px" }}>
                    Receipt No: {receiptViewData.receipt_number}
                  </span>
                  <span style={{ color: "#1C1917", fontSize: "14px" }}>
                    Date: {formatDateDisplay(receiptViewData.receipt_date)}
                  </span>
                </div>

                <div
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: "18px",
                    padding: "16px 18px",
                    marginBottom: "16px",
                  }}
                >
                  <div className="d-flex justify-content-between gap-3">
                    <span style={{ color: "#78716C" }}>Received From</span>
                    <span style={{ fontWeight: 600, color: "#1C1917", textAlign: "right" }}>
                      {receiptViewData.customer_name}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: "18px",
                    padding: "18px",
                    marginBottom: "16px",
                  }}
                >
                  <div className="d-flex justify-content-between gap-3 mb-3">
                    <span style={{ color: "#78716C" }}>Amount Received</span>
                    <span style={{ fontWeight: 700, fontSize: "24px", color: "#1C1917" }}>
                      {formatCurrencyValue(
                        receiptViewData.amount_received,
                        receiptViewData.currency
                      )}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between gap-3 mb-2">
                    <span style={{ color: "#78716C" }}>Currency</span>
                    <span>{receiptViewData.currency}</span>
                  </div>
                  <div className="d-flex justify-content-between gap-3 mb-2">
                    <span style={{ color: "#78716C" }}>Payment Method</span>
                    <span>{receiptViewData.payment_method || "-"}</span>
                  </div>
                  <div className="d-flex justify-content-between gap-3 mb-2">
                    <span style={{ color: "#78716C" }}>Payment Reference</span>
                    <span>{receiptViewData.payment_preference || "-"}</span>
                  </div>
                  <div className="d-flex justify-content-between gap-3">
                    <span style={{ color: "#78716C" }}>Payment Date</span>
                    <span>{formatDateDisplay(receiptViewData.payment_date)}</span>
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: "18px",
                    padding: "18px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    className="d-flex justify-content-between gap-3 mb-3"
                    style={{ color: "#78716C" }}
                  >
                    <span>Items</span>
                    <span>{receiptViewData.items?.length || 0}</span>
                  </div>
                  {(receiptViewData.items || []).map((item, index) => (
                    <div
                      key={`${item?.item_name || "item"}-${index}`}
                      className="d-flex justify-content-between gap-3"
                      style={{
                        paddingTop: index === 0 ? 0 : "12px",
                        marginTop: index === 0 ? 0 : "12px",
                        borderTop: index === 0 ? "none" : "1px solid #F3F4F6",
                      }}
                    >
                      <div>
                        <div style={{ color: "#1C1917", fontWeight: 500 }}>
                          {item?.item_name || "-"}
                        </div>
                        <div style={{ color: "#78716C", fontSize: "13px" }}>
                          Qty {item?.quantity || 0} x{" "}
                          {formatCurrencyValue(
                            item?.unit_price || item?.price || 0,
                            receiptViewData.currency
                          )}
                        </div>
                      </div>
                      <div style={{ color: "#1C1917", fontWeight: 600, textAlign: "right" }}>
                        {formatCurrencyValue(
                          item?.total || item?.price || 0,
                          receiptViewData.currency
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: "18px",
                    padding: "18px",
                    background: "#FAFAFA",
                    marginBottom: "18px",
                  }}
                >
                  <div className="d-flex justify-content-between gap-3">
                    <span style={{ color: "#78716C" }}>Description:</span>
                    <span style={{ maxWidth: "70%", textAlign: "right", color: "#1C1917" }}>
                      {receiptViewData.description || "-"}
                    </span>
                  </div>
                </div>

                <div className="text-center" style={{ color: "#78716C", fontSize: "14px" }}>
                  <p style={{ marginBottom: "10px" }}>
                    {receiptViewData.notes || "Thank you."}
                  </p>
                  <p style={{ marginBottom: 0 }}>
                    {storeInfo?.website || storeInfo?.storefront_link || "www.mycroshop.com"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ReceiptModal>
      )}
    </>
  );
};

export default CreateReceiptView;
