import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faCalendarCheck,
  faChevronLeft,
  faCircleCheck,
  faDownload,
  faEllipsisV,
  faEye,
  faMagnifyingGlass,
  faReceipt,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../../components/ui/Button";
import Pagination from "../../../components/Pagination";
import CreateReceiptView from "./CreateReceiptView";
import {
  getReceiptDetails,
  getReceipts,
  getOnlineStoreOrderDetails,
  getOnlineStoreOrders,
  resetReceiptDetails,
  resetOrderDetails,
  updateOnlineStoreOrderStatus,
} from "../../../slice/order";
import stylesItem from "../../../Tabs.module.css";
import Swal from "sweetalert2";
import { API_URL } from "../../../config/constant";

const EMPTY_STATE_CONTENT = {
  orders: {
    title: "Order List",
    icon: faBoxOpen,
    heading: "No orders yet",
    description: "Orders from your store will appear here",
  },
  bookings: {
    title: "Service Booking List",
    icon: faCalendarCheck,
    heading: "No booked services yet",
    description: "Booked services from your store will appear here",
  },
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_OPTIONS = [
  { value: "", label: "Payment Type" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const RECEIPT_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
];

const ORDER_STATUS_UPDATE_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US").replaceAll("/", "-");
};

const formatLongDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatCurrency = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "₦0.00";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
};

const titleize = (value) =>
  `${value || ""}`
    .replaceAll("_", " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getRecordMetadata = (order) => {
  const metadata = order?.metadata || order?.booking_metadata || {};

  if (metadata && typeof metadata === "object") {
    return metadata;
  }

  if (typeof metadata === "string") {
    try {
      const parsedMetadata = JSON.parse(metadata);
      return parsedMetadata && typeof parsedMetadata === "object" ? parsedMetadata : {};
    } catch {
      return {};
    }
  }

  return {};
};

const isServiceBookingRecord = (order) => {
  const rawType = `${order?.order_type || order?.type || order?.booking_type || ""}`.toLowerCase();
  const metadata = getRecordMetadata(order);
  return (
    rawType.includes("service") ||
    rawType.includes("booking") ||
    Boolean(order?.scheduled_at || metadata?.scheduled_at)
  );
};

const getOrderNumber = (order) =>
  order?.order_number ||
  order?.booking_number ||
  order?.booking_reference ||
  order?.reference_code ||
  order?.reference ||
  order?.reference_no ||
  order?.invoice_number ||
  (order?.id ? `${isServiceBookingRecord(order) ? "BK" : "ORD"}-${order.id}` : "-");

const getCustomerName = (order) =>
  order?.customer_name ||
  getRecordMetadata(order)?.customer_name ||
  order?.customer?.fullName ||
  order?.customer?.name ||
  order?.customer?.full_name ||
  order?.user?.name ||
  order?.user?.full_name ||
  "Walk-in Customer";

const getCustomerEmail = (order) =>
  order?.customer_email ||
  getRecordMetadata(order)?.customer_email ||
  order?.customer?.email ||
  order?.user?.email ||
  "-";

const getItemsCount = (order) => {
  const itemList = order?.items || order?.order_items;

  if (Array.isArray(itemList) && itemList.length) {
    return itemList.reduce((total, item) => {
      const quantity = Number(item?.quantity);
      return total + (Number.isFinite(quantity) ? quantity : 0);
    }, 0);
  }

  return (
    Number(
      order?.items_count ??
        order?.total_items ??
        order?.item_count ??
        order?.products_count ??
        order?.services_count ??
        (isServiceBookingRecord(order) ? 1 : undefined) ??
        0
    ) || 0
  );
};

const getOrderTotal = (order) =>
  order?.total_amount ??
  order?.grand_total ??
  order?.total ??
  order?.amount ??
  order?.service_amount ??
  order?.booking_amount ??
  getRecordMetadata(order)?.amount ??
  order?.paid_amount ??
  0;

const getOrderDate = (order) =>
  order?.scheduled_at ||
  getRecordMetadata(order)?.scheduled_at ||
  order?.appointment_date ||
  order?.booking_date ||
  order?.created_at ||
  order?.date ||
  order?.order_date;

const getOrderItemsList = (order) =>
  order?.OnlineStoreOrderItems ||
  order?.order_items ||
  order?.ServiceBookings ||
  order?.service_bookings ||
  order?.booking_items ||
  order?.items ||
  [];

const getPrimaryPaymentTransaction = (order) =>
  order?.PaymentTransactions?.[0] ||
  order?.payment_transaction ||
  order?.payment ||
  null;

const getCustomerAddress = (order) =>
  [
    order?.customer_address,
    order?.city,
    order?.state,
    order?.country,
  ]
    .filter(Boolean)
    .join(", ") || "-";

const getStatusRank = (status) => {
  const normalizedStatus = `${status || ""}`.toLowerCase();

  if (normalizedStatus.includes("deliver") || normalizedStatus.includes("complete")) {
    return 4;
  }

  if (normalizedStatus.includes("ship")) {
    return 3;
  }

  if (normalizedStatus.includes("process")) {
    return 2;
  }

  if (normalizedStatus.includes("confirm")) {
    return 1;
  }

  if (normalizedStatus.includes("cancel")) {
    return -1;
  }

  return 0;
};

const buildTimeline = (order) => {
  const createdAt = order?.created_at;
  const updatedAt = order?.updated_at || createdAt;
  const statusRank = getStatusRank(order?.status);

  if (statusRank === -1) {
    return [
      { label: "Order Placed", date: createdAt, completed: true },
      { label: "Cancelled", date: updatedAt, completed: true, cancelled: true },
    ];
  }

  return [
    { label: "Order Placed", date: createdAt, completed: true },
    { label: "Processed", date: updatedAt, completed: statusRank >= 1 },
    { label: "Shipped", date: updatedAt, completed: statusRank >= 3 },
    { label: "Delivered", date: updatedAt, completed: statusRank >= 4 },
  ];
};

const escapeHtml = (value) =>
  `${value ?? ""}`
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const createOrderPrintMarkup = (order) => {
  const items = getOrderItemsList(order);
  const paymentTransaction = getPrimaryPaymentTransaction(order);
  const orderNumber = getOrderNumber(order);
  const paymentLabel = titleize(
    order?.payment_status || paymentTransaction?.status || "pending"
  );
  const orderStatusLabel = titleize(order?.status || order?.order_status || "pending");
  const paymentMethod = titleize(
    order?.payment_method ||
      paymentTransaction?.gateway_name ||
      (paymentLabel.toLowerCase() === "paid" ? "online payment" : "pending")
  );

  const itemRows = items.length
    ? items
        .map((item) => {
          const variation =
            item?.variation_name || item?.variation_option_value
              ? `<div class="variation">${escapeHtml(
                  `${item?.variation_name || "Variation"}: ${
                    item?.variation_option_value || "-"
                  }`
                )}</div>`
              : "";

          return `
            <tr>
              <td>
                <div class="product-name">${escapeHtml(
                  item?.product_name || item?.Product?.name || "-"
                )}</div>
                ${variation}
              </td>
              <td>${escapeHtml(Number(item?.quantity) || 0)}</td>
              <td>${escapeHtml(formatCurrency(item?.unit_price))}</td>
              <td>${escapeHtml(formatCurrency(item?.total))}</td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td colspan="4" class="empty-state">No items found for this order.</td>
      </tr>
    `;

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Order Receipt ${escapeHtml(orderNumber)}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 32px;
          font-family: Poppins, Arial, sans-serif;
          background: #f8fafc;
          color: #111827;
        }
        .receipt {
          max-width: 860px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 32px;
        }
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 28px;
        }
        .title {
          margin: 0 0 6px;
          font-size: 28px;
          font-weight: 700;
        }
        .muted {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 8px 14px;
          border-radius: 999px;
          background: #eaf4ff;
          color: #0273f9;
          font-size: 13px;
          font-weight: 600;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 24px;
        }
        .card {
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 18px;
          background: #ffffff;
        }
        .card h3 {
          margin: 0 0 14px;
          font-size: 17px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }
        .info-row:last-child { margin-bottom: 0; }
        .info-label {
          color: #6b7280;
          font-size: 13px;
        }
        .info-value {
          text-align: right;
          font-size: 14px;
          font-weight: 500;
          color: #111827;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          text-align: left;
          padding: 14px 10px;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: top;
          font-size: 14px;
        }
        th {
          color: #6b7280;
          font-weight: 600;
        }
        .product-name {
          font-weight: 600;
          color: #111827;
        }
        .variation {
          margin-top: 4px;
          font-size: 12px;
          color: #6b7280;
        }
        .totals {
          margin-top: 18px;
          margin-left: auto;
          max-width: 320px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 8px 0;
          font-size: 14px;
        }
        .total-row.grand {
          border-top: 1px solid #e5e7eb;
          margin-top: 8px;
          padding-top: 14px;
          font-size: 16px;
          font-weight: 700;
        }
        .empty-state {
          color: #6b7280;
          text-align: center;
        }
        @media print {
          body {
            background: #ffffff;
            padding: 0;
          }
          .receipt {
            border: none;
            border-radius: 0;
            max-width: none;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <main class="receipt">
        <section class="topbar">
          <div>
            <h1 class="title">Order Receipt</h1>
            <p class="muted">${escapeHtml(orderNumber)}</p>
            <p class="muted">Created on ${escapeHtml(formatLongDate(getOrderDate(order)))}</p>
          </div>
          <div>
            <div class="badge">${escapeHtml(orderStatusLabel)}</div>
          </div>
        </section>

        <section class="grid">
          <article class="card">
            <h3>Customer Information</h3>
            <div class="info-row">
              <span class="info-label">Customer Name</span>
              <span class="info-value">${escapeHtml(getCustomerName(order))}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">${escapeHtml(getCustomerEmail(order))}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone</span>
              <span class="info-value">${escapeHtml(order?.customer_phone || "-")}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Address</span>
              <span class="info-value">${escapeHtml(getCustomerAddress(order))}</span>
            </div>
          </article>

          <article class="card">
            <h3>Payment Information</h3>
            <div class="info-row">
              <span class="info-label">Payment Status</span>
              <span class="info-value">${escapeHtml(paymentLabel)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Method</span>
              <span class="info-value">${escapeHtml(paymentMethod)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Transaction ID</span>
              <span class="info-value">${escapeHtml(
                paymentTransaction?.transaction_reference || order?.idempotency_key || "-"
              )}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Date</span>
              <span class="info-value">${escapeHtml(
                formatLongDate(paymentTransaction?.paid_at || order?.updated_at || order?.created_at)
              )}</span>
            </div>
          </article>
        </section>

        <article class="card">
          <h3>Order Items</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${escapeHtml(formatCurrency(order?.subtotal))}</span>
            </div>
            <div class="total-row">
              <span>Tax</span>
              <span>${escapeHtml(formatCurrency(order?.tax_amount))}</span>
            </div>
            <div class="total-row">
              <span>Shipping</span>
              <span>${escapeHtml(formatCurrency(order?.shipping_amount))}</span>
            </div>
            <div class="total-row">
              <span>Discount</span>
              <span>${escapeHtml(formatCurrency(order?.discount_amount))}</span>
            </div>
            <div class="total-row grand">
              <span>Total</span>
              <span>${escapeHtml(formatCurrency(order?.total))}</span>
            </div>
          </div>
        </article>
      </main>
    </body>
  </html>`;
};

const getTypeConfig = (order, activeTab) => {
  const rawType = `${(
    order?.type ||
    order?.channel ||
    order?.order_channel ||
    order?.delivery_type ||
    order?.order_type ||
    ""
  ).toLowerCase()}`;

  if (activeTab === "bookings" || rawType.includes("service") || rawType.includes("booking")) {
    return {
      label: "Service",
      className: stylesItem.schedule,
    };
  }

  if (
    rawType.includes("physical") ||
    rawType.includes("pickup") ||
    rawType.includes("offline") ||
    rawType.includes("walk")
  ) {
    return {
      label: "Physical",
      className: stylesItem.physical,
    };
  }

  return {
    label: "Online",
    className: stylesItem.online,
  };
};

const getPaymentClassName = (paymentStatus) => {
  const normalizedStatus = `${paymentStatus || ""}`.toLowerCase();

  if (normalizedStatus.includes("paid") || normalizedStatus.includes("success")) {
    return stylesItem.paid;
  }

  if (normalizedStatus.includes("pending")) {
    return stylesItem.pending;
  }

  if (
    normalizedStatus.includes("failed") ||
    normalizedStatus.includes("cancel") ||
    normalizedStatus.includes("refund")
  ) {
    return stylesItem.cancelled;
  }

  return stylesItem.pending;
};

const getOrderStatusClassName = (status) => {
  const normalizedStatus = `${status || ""}`.toLowerCase();

  if (normalizedStatus.includes("deliver") || normalizedStatus.includes("complete")) {
    return stylesItem.delivered;
  }

  if (normalizedStatus.includes("ship")) {
    return stylesItem.shipped;
  }

  if (normalizedStatus.includes("process") || normalizedStatus.includes("confirm")) {
    return stylesItem.processing;
  }

  if (normalizedStatus.includes("cancel")) {
    return stylesItem.cancelled;
  }

  return stylesItem.pending;
};

const getReceiptNumber = (receipt) =>
  receipt?.receipt_number ||
  receipt?.reference ||
  receipt?.receipt_no ||
  receipt?.number ||
  (receipt?.id ? `RCT-${receipt.id}` : "-");

const getReceiptDate = (receipt) =>
  receipt?.issued_at ||
  receipt?.created_at ||
  receipt?.date ||
  receipt?.payment_date ||
  null;

const getReceiptType = (receipt) =>
  titleize(
    receipt?.receipt_type ||
      receipt?.type ||
      (receipt?.invoice_id ? "invoice receipt" : "standalone")
  );

const getReceiptInvoiceId = (receipt) =>
  receipt?.invoice_id ? `INV-${receipt.invoice_id}` : "Standalone";

const getReceiptPreviewUrl = (receipt) =>
  receipt?.preview_url || receipt?.image_url || "";

const getReceiptPdfUrl = (receipt) =>
  receipt?.pdf_url || receipt?.document_url || "";

const resolveReceiptAssetUrl = (value) => {
  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  const normalizedValue = value.startsWith("/") ? value : `/${value}`;
  return new URL(normalizedValue, API_URL).href;
};

const getReceiptCustomerName = (receipt) =>
  receipt?.customer_name || receipt?.customer?.name || "Walk-in Customer";

const getReceiptCustomerEmail = (receipt) =>
  receipt?.customer_email || receipt?.customer?.email || "-";

const getReceiptCustomerPhone = (receipt) =>
  receipt?.customer_phone || receipt?.phone || receipt?.customer?.phone || "-";

const getReceiptAmount = (receipt) =>
  receipt?.amount_received ??
  receipt?.total ??
  receipt?.paid_amount ??
  receipt?.amount ??
  0;

const getReceiptStatus = (receipt) =>
  titleize(receipt?.status || receipt?.payment_status || "saved");

const getReceiptStatusClassName = (receipt) => {
  const normalizedStatus = `${receipt?.status || receipt?.payment_status || "saved"}`.toLowerCase();

  if (normalizedStatus.includes("paid") || normalizedStatus.includes("success")) {
    return stylesItem.paid;
  }

  if (normalizedStatus.includes("process")) {
    return stylesItem.processing;
  }

  if (normalizedStatus.includes("pending")) {
    return stylesItem.pending;
  }

  if (normalizedStatus.includes("fail") || normalizedStatus.includes("cancel")) {
    return stylesItem.cancelled;
  }

  return stylesItem.online;
};

const OrderDetailsView = ({
  order,
  loading,
  error,
  onBack,
  onPrint,
  onUpdateStatus,
  statusUpdating,
}) => {
  const items = getOrderItemsList(order);
  const paymentTransaction = getPrimaryPaymentTransaction(order);
  const orderNumber = getOrderNumber(order);
  const paymentLabel = titleize(
    order?.payment_status || paymentTransaction?.status || "pending"
  );
  const orderStatusLabel = titleize(order?.status || order?.order_status || "pending");
  const paymentMethod = titleize(
    order?.payment_method ||
      paymentTransaction?.gateway_name ||
      (paymentLabel.toLowerCase() === "paid" ? "online payment" : "pending")
  );
  const paymentReference =
    paymentTransaction?.transaction_reference || order?.idempotency_key || "-";
  const shippingMethod =
    titleize(order?.shipping_method) ||
    (Number(order?.shipping_amount) > 0 ? "Delivery" : "Free Delivery");
  const trackingNumber =
    order?.tracking_number || order?.shipment_tracking_number || "-";
  const timeline = buildTimeline(order);
  const [isFulfilled, setIsFulfilled] = useState(
    getStatusRank(order?.status) >= 4
  );

  if (loading) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "420px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading order details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Button
          unstyled
          onClick={onBack}
          style={{ color: "var(--app-text-muted)", fontSize: "15px", marginBottom: "16px" }}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
          Back to Orders
        </Button>
        <div
          className="rounded-3"
          style={{
            border: "1px solid #FECACA",
            background: "#FEF2F2",
            color: "#B91C1C",
            padding: "14px 16px",
          }}
        >
          {error?.message || error?.error || "Unable to load this order right now."}
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-3">
        <div>
          <Button
            unstyled
            onClick={onBack}
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
            Back to Orders
          </Button>
          <h4 className="mb-0" style={{ color: "var(--app-text)", fontWeight: 700 }}>
            Order {orderNumber}
          </h4>
        </div>

        <div className="d-flex flex-wrap gap-2 justify-content-md-end">
          <Button
            unstyled
            onClick={onUpdateStatus}
            disabled={statusUpdating}
            style={{
              minWidth: "152px",
              padding: "10px 18px",
              borderRadius: "10px",
              border: "1px solid #D6E8FF",
              background: "#EBF4FF",
              color: "#0273F9",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            {statusUpdating ? "Updating..." : "Update Status"}
          </Button>
          <Button
            variant="blueButton"
            size="md"
            onClick={onPrint}
            style={{ minWidth: "164px" }}
          >
            Print Order Receipt
          </Button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <div
            className="card shadow-sm"
            style={{ border: "1px solid #EEEEEE", borderRadius: "12px", overflow: "hidden" }}
          >
            <div className="card-body p-0">
              <div className="d-flex justify-content-between align-items-start gap-3 p-3">
                <div>
                  <h5 className="mb-1" style={{ color: "var(--app-text)", fontSize: "16px" }}>
                    Order Details
                  </h5>
                  <p className="mb-0" style={{ color: "var(--app-text-muted)", fontSize: "14px" }}>
                    Created on {formatLongDate(getOrderDate(order))}
                  </p>
                </div>
                <span
                  className={`${stylesItem["status-btn"]} ${getOrderStatusClassName(orderStatusLabel)}`}
                >
                  {orderStatusLabel}
                </span>
              </div>

              <hr className="m-0" />

              <div className="row g-0">
                <div className="col-12 col-md-6 p-3">
                  <small className="d-block mb-2" style={{ color: "var(--app-text-muted)" }}>
                    Order Type
                  </small>
                  <span style={{ color: "var(--app-text)", fontSize: "16px" }}>Online Order</span>
                </div>
                <div className="col-12 col-md-6 p-3">
                  <small className="d-block mb-2" style={{ color: "var(--app-text-muted)" }}>
                    Payment Status
                  </small>
                  <span
                    className={`${stylesItem["status-btn"]} ${getPaymentClassName(paymentLabel)}`}
                  >
                    {paymentLabel}
                  </span>
                </div>
              </div>

              <hr className="m-0" />

              <div className="p-3">
                <h5 className="mb-3" style={{ color: "var(--app-text)", fontSize: "16px" }}>
                  Order Items
                </h5>

                <div className="table-responsive">
                  <table className="table mb-0">
                    <thead>
                      <tr>
                        <th style={{ color: "var(--app-text-muted)", fontSize: "14px", borderBottom: "1px solid #E5E7EB" }}>
                          Product
                        </th>
                        <th style={{ color: "var(--app-text-muted)", fontSize: "14px", borderBottom: "1px solid #E5E7EB" }}>
                          Quantity
                        </th>
                        <th style={{ color: "var(--app-text-muted)", fontSize: "14px", borderBottom: "1px solid #E5E7EB" }}>
                          Unit Price
                        </th>
                        <th style={{ color: "var(--app-text-muted)", fontSize: "14px", borderBottom: "1px solid #E5E7EB" }}>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length ? (
                        items.map((item) => (
                          <tr key={item?.id || `${item?.product_id}-${item?.variation_option_id}`}>
                            <td style={{ borderBottom: "1px solid #F3F4F6", paddingTop: "14px", paddingBottom: "14px" }}>
                              <div style={{ color: "var(--app-text)", fontSize: "15px" }}>
                                {item?.product_name || item?.Product?.name || "-"}
                              </div>
                              {(item?.variation_name || item?.variation_option_value) && (
                                <small style={{ color: "var(--app-text-muted)" }}>
                                  {item?.variation_name || "Variation"}: {item?.variation_option_value || "-"}
                                </small>
                              )}
                            </td>
                            <td style={{ color: "var(--app-text)", borderBottom: "1px solid #F3F4F6", paddingTop: "14px", paddingBottom: "14px" }}>
                              {Number(item?.quantity) || 0}
                            </td>
                            <td style={{ color: "var(--app-text)", borderBottom: "1px solid #F3F4F6", paddingTop: "14px", paddingBottom: "14px" }}>
                              {formatCurrency(item?.unit_price)}
                            </td>
                            <td style={{ color: "var(--app-text)", borderBottom: "1px solid #F3F4F6", paddingTop: "14px", paddingBottom: "14px" }}>
                              {formatCurrency(item?.total)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-4" style={{ color: "var(--app-text-muted)" }}>
                            No items found for this order.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div
                className="d-flex justify-content-end"
                style={{ background: "#F6F6F6", padding: "14px 18px" }}
              >
                <div style={{ fontSize: "15px", color: "var(--app-text-muted)" }}>
                  Total Order{" "}
                  <span style={{ color: "var(--app-text)", fontWeight: 600 }}>
                    {formatCurrency(order?.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="card shadow-sm mt-4"
            style={{ border: "1px solid #EEEEEE", borderRadius: "12px", overflow: "hidden" }}
          >
            <div className="card-body p-0">
              <div className="p-3">
                <h5 className="mb-0" style={{ color: "var(--app-text)", fontSize: "16px" }}>
                  Payment Information
                </h5>
              </div>
              <hr className="m-0" />
              <div className="m-3 rounded-3" style={{ background: "#FAFAFA", padding: "16px" }}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <small className="d-block mb-1" style={{ color: "var(--app-text-muted)" }}>
                      Payment Method:
                    </small>
                    <span style={{ color: "var(--app-text)" }}>{paymentMethod}</span>
                  </div>
                  <div className="col-12 col-md-6">
                    <small className="d-block mb-1" style={{ color: "var(--app-text-muted)" }}>
                      Transaction ID:
                    </small>
                    <span style={{ color: "var(--app-text)" }}>{paymentReference}</span>
                  </div>
                  <div className="col-12 col-md-6">
                    <small className="d-block mb-1" style={{ color: "var(--app-text-muted)" }}>
                      Payment Date:
                    </small>
                    <span style={{ color: "var(--app-text)" }}>
                      {formatLongDate(paymentTransaction?.paid_at || order?.updated_at || order?.created_at)}
                    </span>
                  </div>
                  <div className="col-12 col-md-6">
                    <small className="d-block mb-1" style={{ color: "var(--app-text-muted)" }}>
                      Amount Paid:
                    </small>
                    <span style={{ color: "var(--app-text)" }}>
                      {formatCurrency(paymentTransaction?.amount || order?.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="card shadow-sm mt-4"
            style={{ border: "1px solid #EEEEEE", borderRadius: "12px", overflow: "hidden" }}
          >
            <div className="card-body p-0">
              <div className="p-3">
                <h5 className="mb-0" style={{ color: "var(--app-text)", fontSize: "16px" }}>
                  Shipping Information
                </h5>
              </div>
              <hr className="m-0" />
              <div className="m-3 rounded-3" style={{ background: "#FAFAFA", padding: "16px" }}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <small className="d-block mb-1" style={{ color: "var(--app-text-muted)" }}>
                      Shipping Method:
                    </small>
                    <span style={{ color: "var(--app-text)" }}>{shippingMethod}</span>
                  </div>
                  <div className="col-12 col-md-6">
                    <small className="d-block mb-1" style={{ color: "var(--app-text-muted)" }}>
                      Tracking Number:
                    </small>
                    <span style={{ color: "var(--app-text)" }}>{trackingNumber}</span>
                  </div>
                  <div className="col-12">
                    <small className="d-block mb-1" style={{ color: "var(--app-text-muted)" }}>
                      Delivery Address:
                    </small>
                    <span style={{ color: "var(--app-text)" }}>{getCustomerAddress(order)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="card shadow-sm mt-4"
            style={{ border: "1px solid #EEEEEE", borderRadius: "12px", overflow: "hidden" }}
          >
            <div className="card-body">
              <label
                className={stylesItem.orderFulfilledToggle}
                style={{ color: "var(--app-text-muted)" }}
              >
                <input
                  type="checkbox"
                  checked={isFulfilled}
                  onChange={(event) => setIsFulfilled(event.target.checked)}
                />
                <span className={stylesItem.orderFulfilledToggleBox} aria-hidden="true">
                  <FontAwesomeIcon icon={faCircleCheck} />
                </span>
                <span>Mark as fulfilled</span>
              </label>
            </div>
          </div>

          <div className={stylesItem.orderDetailsActionRow} style={{ marginTop: "24px" }}>
            <Button
              unstyled
              disabled
              className={stylesItem.orderDetailsActionButton}
              style={{
                padding: "12px 20px",
                borderRadius: "10px",
                border: "1px solid #E5E7EB",
                background: "transparent",
                color: "#DC2626",
                opacity: 0.65,
              }}
            >
              Cancel Order
            </Button>
            <Button
              unstyled
              disabled
              className={stylesItem.orderDetailsActionButton}
              style={{
                padding: "12px 20px",
                borderRadius: "10px",
                border: "1px solid #D6E8FF",
                background: "#EBF4FF",
                color: "#0273F9",
                opacity: 0.65,
              }}
            >
              Refund
            </Button>
            <Button
              variant="blueButton"
              size="md"
              onClick={onPrint}
              className={stylesItem.orderDetailsActionButton}
              style={{ borderRadius: "10px" }}
            >
              Print Order Receipt
            </Button>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div
            className="card shadow-sm"
            style={{ border: "1px solid #EEEEEE", borderRadius: "12px", overflow: "hidden" }}
          >
            <div className="card-body p-0">
              <div className="p-3">
                <h5 className="mb-0" style={{ color: "var(--app-text)", fontSize: "16px" }}>
                  Customer Information
                </h5>
              </div>
              <hr className="m-0" />
              <div className="m-3 rounded-3" style={{ background: "#FAFAFA", padding: "16px" }}>
                <div className="row g-3">
                  <div className="col-12">
                    <small className="d-block mb-1" style={{ color: "var(--app-text-muted)" }}>
                      Customer Name:
                    </small>
                    <span style={{ color: "var(--app-text)" }}>{getCustomerName(order)}</span>
                  </div>
                  <div className="col-12">
                    <small className="d-block mb-1" style={{ color: "var(--app-text-muted)" }}>
                      Email:
                    </small>
                    <span style={{ color: "var(--app-text)" }}>{getCustomerEmail(order)}</span>
                  </div>
                  <div className="col-12">
                    <small className="d-block mb-1" style={{ color: "var(--app-text-muted)" }}>
                      Phone:
                    </small>
                    <span style={{ color: "var(--app-text)" }}>{order?.customer_phone || "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="card shadow-sm mt-4"
            style={{ border: "1px solid #EEEEEE", borderRadius: "12px", overflow: "hidden" }}
          >
            <div className="card-body p-0">
              <div className="p-3">
                <h5 className="mb-0" style={{ color: "var(--app-text)", fontSize: "16px" }}>
                  Order Timeline
                </h5>
              </div>
              <hr className="m-0" />
              <div className="p-3">
                {timeline.map((step, index) => {
                  const isLast = index === timeline.length - 1;
                  const stepColor = step.cancelled ? "#DC2626" : "#16A34A";

                  return (
                    <div key={`${step.label}-${index}`} className="d-flex align-items-start position-relative" style={{ paddingBottom: isLast ? 0 : "26px" }}>
                      {!isLast && (
                        <span
                          style={{
                            position: "absolute",
                            top: "26px",
                            left: "9px",
                            width: "2px",
                            height: "calc(100% - 10px)",
                            background: step.completed ? `${stepColor}40` : "#E5E7EB",
                          }}
                        />
                      )}

                      <FontAwesomeIcon
                        icon={faCircleCheck}
                        style={{
                          color: step.completed ? stepColor : "#CBD5E1",
                          fontSize: "20px",
                          marginTop: "2px",
                          position: "relative",
                          zIndex: 1,
                          background: "var(--app-surface)",
                        }}
                      />

                      <div className="ms-3">
                        <div style={{ color: "var(--app-text)", fontWeight: 500, fontSize: "15px" }}>
                          {step.label}
                        </div>
                        <div style={{ color: "var(--app-text-muted)", fontSize: "13px" }}>
                          {formatLongDate(step.date)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReceiptManagementView = ({
  onBack,
  onCreateReceipt,
  onExport,
  onOpenReceiptDetails,
  onCloseReceiptDetails,
  loading,
  error,
  receipts,
  selectedReceipt,
  receiptDetailsLoading,
  receiptDetailsError,
  receiptDetails,
  searchInput,
  onSearchInputChange,
  status,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  pagination,
  onPageChange,
}) => {
  const hasReceipts = receipts.length > 0;
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleDropdown = (receiptId) => {
    setOpenDropdown((prev) => (prev === receiptId ? null : receiptId));
  };

  const handlePreviewReceipt = (receipt) => {
    const previewUrl =
      resolveReceiptAssetUrl(getReceiptPreviewUrl(receipt)) ||
      resolveReceiptAssetUrl(getReceiptPdfUrl(receipt));

    if (previewUrl) {
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    }

    setOpenDropdown(null);
  };

  const handleDownloadReceipt = (receipt) => {
    const downloadUrl =
      resolveReceiptAssetUrl(getReceiptPdfUrl(receipt)) ||
      resolveReceiptAssetUrl(getReceiptPreviewUrl(receipt));

    if (!downloadUrl) {
      setOpenDropdown(null);
      return;
    }

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = `${getReceiptNumber(receipt) || "receipt"}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setOpenDropdown(null);
  };

  return (
    <div>
      {selectedReceipt && (
        <div
          onClick={onCloseReceiptDetails}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.66)",
            zIndex: 2450,
            padding: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(760px, 100%)",
              maxHeight: "90vh",
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.24)",
            }}
          >
            <div
              className="d-flex justify-content-between align-items-center px-4 py-3"
              style={{ borderBottom: "1px solid #E5E7EB" }}
            >
              <div>
                <h6 className="mb-1">Receipt Details</h6>
                <small style={{ color: "#6B7280" }}>
                  {getReceiptNumber(receiptDetails || selectedReceipt)}
                </small>
              </div>
              <button
                type="button"
                className="btn"
                onClick={onCloseReceiptDetails}
                style={{
                  padding: "8px 14px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  fontSize: "13px",
                  backgroundColor: "#fff",
                }}
              >
                Close
              </button>
            </div>
            <div style={{ padding: "20px 24px", overflowY: "auto", maxHeight: "calc(90vh - 72px)" }}>
              {receiptDetailsLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading receipt details...</span>
                  </div>
                  <p style={{ marginTop: "12px", marginBottom: 0, color: "#6B7280", fontSize: "13px" }}>
                    Loading receipt details...
                  </p>
                </div>
              ) : receiptDetailsError ? (
                <div
                  style={{
                    border: "1px solid #FECACA",
                    backgroundColor: "#FEF2F2",
                    color: "#991B1B",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    fontSize: "13px",
                  }}
                >
                  {receiptDetailsError?.message || receiptDetailsError?.error || "Unable to load receipt details."}
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "14px",
                      marginBottom: "20px",
                    }}
                  >
                    <div style={{ padding: "14px", borderRadius: "14px", backgroundColor: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                      <small style={{ display: "block", color: "#6B7280", marginBottom: "6px" }}>Receipt Number</small>
                      <div style={{ fontSize: "14px", color: "#111827", fontWeight: 600 }}>
                        {getReceiptNumber(receiptDetails)}
                      </div>
                    </div>
                    <div style={{ padding: "14px", borderRadius: "14px", backgroundColor: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                      <small style={{ display: "block", color: "#6B7280", marginBottom: "6px" }}>Invoice ID</small>
                      <div style={{ fontSize: "14px", color: "#111827", fontWeight: 600 }}>
                        {getReceiptInvoiceId(receiptDetails)}
                      </div>
                    </div>
                    <div style={{ padding: "14px", borderRadius: "14px", backgroundColor: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                      <small style={{ display: "block", color: "#6B7280", marginBottom: "6px" }}>Created At</small>
                      <div style={{ fontSize: "14px", color: "#111827", fontWeight: 600 }}>
                        {formatLongDate(getReceiptDate(receiptDetails))}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mb-4">
                    <button
                      type="button"
                      className="btn"
                      disabled={!resolveReceiptAssetUrl(getReceiptPreviewUrl(receiptDetails))}
                      onClick={() =>
                        window.open(
                          resolveReceiptAssetUrl(getReceiptPreviewUrl(receiptDetails)),
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      style={{
                        padding: "9px 14px",
                        border: "1px solid #BFDBFE",
                        borderRadius: "10px",
                        fontSize: "13px",
                        color: resolveReceiptAssetUrl(getReceiptPreviewUrl(receiptDetails)) ? "#1D4ED8" : "#9CA3AF",
                        backgroundColor: "#EFF6FF",
                      }}
                    >
                      <FontAwesomeIcon icon={faEye} className="me-2" />
                      Open Preview
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={!resolveReceiptAssetUrl(getReceiptPdfUrl(receiptDetails))}
                      onClick={() =>
                        window.open(
                          resolveReceiptAssetUrl(getReceiptPdfUrl(receiptDetails)),
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      style={{
                        padding: "9px 14px",
                        border: "1px solid #D1FAE5",
                        borderRadius: "10px",
                        fontSize: "13px",
                        color: resolveReceiptAssetUrl(getReceiptPdfUrl(receiptDetails)) ? "#047857" : "#9CA3AF",
                        backgroundColor: "#ECFDF5",
                      }}
                    >
                      <FontAwesomeIcon icon={faReceipt} className="me-2" />
                      Open PDF
                    </button>
                  </div>

                </>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-4">
        <div>
          <Button
            unstyled
            onClick={onBack}
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
            Back to Orders
          </Button>

          <h4 className="mb-0" style={{ color: "var(--app-text)", fontWeight: 700, fontSize: "20px" }}>
            Manage Receipts
          </h4>
        </div>

        <Button
          variant="blueButton"
          size="md"
          onClick={onCreateReceipt}
          style={{ minWidth: "160px" }}
        >
          Create Receipt
        </Button>
      </div>

      <div
        className="card shadow-sm"
        style={{
          border: "1px solid #EEEEEE",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div className="card-body p-0">
          <div className="p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <h5 className="mb-0" style={{ color: "var(--app-text)", fontSize: "16px" }}>
              {hasReceipts ? "Order List" : "Receipt List"}
            </h5>
            {hasReceipts && (
              <Button
                unstyled
                onClick={onExport}
                style={{
                  minWidth: "92px",
                  padding: "12px 18px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  background: "#FFFFFF",
                  color: "#1C1917",
                  fontSize: "14px",
                  fontWeight: 600,
                  alignSelf: "flex-start",
                }}
              >
                Export
              </Button>
            )}
          </div>
          <hr className="m-0" />

          {loading ? (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ minHeight: "220px" }}
            >
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading receipts...</span>
              </div>
            </div>
          ) : hasReceipts ? (
            <>
              <div className="p-3">
                <div className="d-flex flex-column flex-xl-row justify-content-between gap-3 align-items-xl-center">
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      maxWidth: "280px",
                      flexShrink: 0,
                    }}
                  >
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(event) => onSearchInputChange(event.target.value)}
                      placeholder="Search for receipts"
                      className={`form-control ${stylesItem["input-item"]}`}
                      style={{
                        paddingRight: "46px",
                        paddingLeft: "14px",
                        background: "#FFFFFF",
                        height: "44px",
                      }}
                    />
                    <FontAwesomeIcon
                      icon={faMagnifyingGlass}
                      style={{
                        position: "absolute",
                        right: "16px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#9CA3AF",
                        pointerEvents: "none",
                        fontSize: "16px",
                      }}
                    />
                  </div>

                  <div className="d-flex flex-wrap gap-2 justify-content-xl-end">
                    <select
                      value="all"
                      onChange={() => {}}
                      className={`form-select ${stylesItem["input-item"]}`}
                      style={{ width: "150px", background: "#FFFFFF", fontSize: "12px" }}
                    >
                      <option value="all">All Receipt</option>
                    </select>
                    <select
                      value={status}
                      onChange={(event) => onStatusChange(event.target.value)}
                      className={`form-select ${stylesItem["input-item"]}`}
                      style={{ width: "145px", background: "#FFFFFF", fontSize: "12px" }}
                    >
                      {RECEIPT_STATUS_OPTIONS.map((option) => (
                        <option key={option.value || "all-receipt-status"} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => onStartDateChange(event.target.value)}
                      className={`form-control ${stylesItem["input-item"]}`}
                      style={{ width: "150px", background: "#FFFFFF", fontSize: "12px" }}
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(event) => onEndDateChange(event.target.value)}
                      className={`form-control ${stylesItem["input-item"]}`}
                      style={{ width: "150px", background: "#FFFFFF", fontSize: "12px" }}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div
                  className="mx-3 mb-3 rounded-3"
                  style={{
                    border: "1px solid #FECACA",
                    background: "#FEF2F2",
                    color: "#B91C1C",
                    padding: "12px 14px",
                    fontSize: "14px",
                  }}
                >
                  {error?.message || error?.error || "Unable to load receipts right now."}
                </div>
              )}

              <div className="table-responsive px-3 pb-1">
                <table className="table align-middle mb-0">
                  <thead style={{ background: "#F8FAFC" }}>
                    <tr>
                      <th style={{ fontSize: "12px", fontWeight: 600, color: "#374151", borderBottom: "1px solid #E5E7EB", background: "#F8FAFC", paddingTop: "14px", paddingBottom: "14px" }}>Receipt #</th>
                      <th style={{ fontSize: "12px", fontWeight: 600, color: "#374151", borderBottom: "1px solid #E5E7EB", background: "#F8FAFC", paddingTop: "14px", paddingBottom: "14px" }}>Customer Name</th>
                      <th style={{ fontSize: "12px", fontWeight: 600, color: "#374151", borderBottom: "1px solid #E5E7EB", background: "#F8FAFC", paddingTop: "14px", paddingBottom: "14px" }}>Customer Phone</th>
                      <th style={{ fontSize: "12px", fontWeight: 600, color: "#374151", borderBottom: "1px solid #E5E7EB", background: "#F8FAFC", paddingTop: "14px", paddingBottom: "14px" }}>Type</th>
                      <th style={{ fontSize: "12px", fontWeight: 600, color: "#374151", borderBottom: "1px solid #E5E7EB", background: "#F8FAFC", paddingTop: "14px", paddingBottom: "14px" }}>Amount Received</th>
                      <th style={{ fontSize: "12px", fontWeight: 600, color: "#374151", borderBottom: "1px solid #E5E7EB", background: "#F8FAFC", paddingTop: "14px", paddingBottom: "14px" }}>Date</th>
                      <th style={{ fontSize: "12px", fontWeight: 600, color: "#374151", borderBottom: "1px solid #E5E7EB", background: "#F8FAFC", paddingTop: "14px", paddingBottom: "14px" }}>Status</th>
                      <th style={{ width: "42px", borderBottom: "1px solid #E5E7EB", background: "#F8FAFC" }} />
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((receipt) => {
                      const receiptKey = receipt?.id || getReceiptNumber(receipt);

                      return (
                        <tr
                          key={receiptKey}
                          onClick={() => onOpenReceiptDetails(receipt)}
                          style={{ background: "#FFFFFF", cursor: "pointer" }}
                        >
                          <td style={{ fontSize: "12px", color: "#374151", borderBottom: "1px solid #F3F4F6", paddingTop: "22px", paddingBottom: "22px" }}>
                            {getReceiptNumber(receipt)}
                          </td>
                          <td style={{ fontSize: "12px", color: "#374151", borderBottom: "1px solid #F3F4F6", paddingTop: "18px", paddingBottom: "18px" }}>
                            <div style={{ color: "#1F2937", fontWeight: 600, fontSize: "12px" }}>
                              {getReceiptCustomerName(receipt)}
                            </div>
                            <div style={{ color: "#78716C", fontSize: "11px", marginTop: "4px" }}>
                              {getReceiptCustomerEmail(receipt)}
                            </div>
                          </td>
                          <td style={{ fontSize: "12px", color: "#374151", borderBottom: "1px solid #F3F4F6", paddingTop: "18px", paddingBottom: "18px" }}>
                            {getReceiptCustomerPhone(receipt)}
                          </td>
                          <td style={{ borderBottom: "1px solid #F3F4F6", paddingTop: "18px", paddingBottom: "18px" }}>
                            <span className={`${stylesItem["status-btn"]} ${stylesItem.online}`}>
                              {getReceiptType(receipt)}
                            </span>
                          </td>
                          <td style={{ fontSize: "12px", color: "#374151", borderBottom: "1px solid #F3F4F6", paddingTop: "18px", paddingBottom: "18px" }}>
                            {formatCurrency(getReceiptAmount(receipt))}
                          </td>
                          <td style={{ fontSize: "12px", color: "#374151", borderBottom: "1px solid #F3F4F6", paddingTop: "18px", paddingBottom: "18px" }}>
                            {formatDate(getReceiptDate(receipt))}
                          </td>
                          <td style={{ borderBottom: "1px solid #F3F4F6", paddingTop: "18px", paddingBottom: "18px" }}>
                            <span className={`${stylesItem["status-btn"]} ${getReceiptStatusClassName(receipt)}`}>
                              {getReceiptStatus(receipt)}
                            </span>
                          </td>
                          <td style={{ borderBottom: "1px solid #F3F4F6", paddingTop: "18px", paddingBottom: "18px" }}>
                            <div
                              style={{ position: "relative", display: "inline-flex" }}
                              ref={openDropdown === receiptKey ? dropdownRef : null}
                            >
                              <Button
                                unstyled
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleToggleDropdown(receiptKey);
                                }}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  color: "#374151",
                                  padding: "4px 8px",
                                  lineHeight: 1,
                                }}
                              >
                                <FontAwesomeIcon icon={faEllipsisV} />
                              </Button>

                              {openDropdown === receipt?.id && (
                                <div
                                  style={{
                                    position: "absolute",
                                    right: 0,
                                    top: "calc(100% + 8px)",
                                    minWidth: "156px",
                                    background: "#FFFFFF",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: "12px",
                                    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
                                    padding: "6px",
                                    zIndex: 20,
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handlePreviewReceipt(receipt);
                                    }}
                                    disabled={!getReceiptPreviewUrl(receipt) && !getReceiptPdfUrl(receipt)}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                      width: "100%",
                                      border: "none",
                                      background: "transparent",
                                      color:
                                        !getReceiptPreviewUrl(receipt) && !getReceiptPdfUrl(receipt)
                                          ? "#9CA3AF"
                                          : "#374151",
                                      fontSize: "13px",
                                      padding: "10px 12px",
                                      borderRadius: "8px",
                                      textAlign: "left",
                                      cursor:
                                        !getReceiptPreviewUrl(receipt) && !getReceiptPdfUrl(receipt)
                                          ? "not-allowed"
                                          : "pointer",
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faEye} style={{ color: "#0273F9" }} />
                                    Preview
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleDownloadReceipt(receipt);
                                    }}
                                    disabled={!getReceiptPdfUrl(receipt) && !getReceiptPreviewUrl(receipt)}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                      width: "100%",
                                      border: "none",
                                      background: "transparent",
                                      color:
                                        !getReceiptPdfUrl(receipt) && !getReceiptPreviewUrl(receipt)
                                          ? "#9CA3AF"
                                          : "#374151",
                                      fontSize: "13px",
                                      padding: "10px 12px",
                                      borderRadius: "8px",
                                      textAlign: "left",
                                      cursor:
                                        !getReceiptPdfUrl(receipt) && !getReceiptPreviewUrl(receipt)
                                          ? "not-allowed"
                                          : "pointer",
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faDownload} style={{ color: "#0273F9" }} />
                                    Download
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={pagination?.page || 1}
                totalPages={pagination?.total_pages || 1}
                onPageChange={onPageChange}
                itemsPerPage={pagination?.limit || 10}
                totalItems={pagination?.total_items || receipts.length}
                disabled={loading}
                className="px-1 pb-1"
              />
            </>
          ) : (
            <div className="p-3">
              <div
                className="d-flex flex-column align-items-center justify-content-center text-center"
                style={{
                  minHeight: "210px",
                  border: "1px dashed #D2D1D1",
                  borderRadius: "12px",
                  background: "#FAFAFA",
                  padding: "32px 20px",
                }}
              >
                <FontAwesomeIcon
                  icon={faReceipt}
                  style={{ fontSize: "24px", color: "var(--app-text)", marginBottom: "18px" }}
                />
                <p className="mb-1" style={{ color: "var(--app-text)", fontSize: "16px", fontWeight: 500 }}>
                  No receipt available
                </p>
                <p className="mb-3" style={{ color: "var(--app-text-muted)", fontSize: "14px" }}>
                  You haven&apos;t issued any receipt yet
                </p>
                <Button
                  unstyled
                  onClick={onCreateReceipt}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    border: "1px solid #D6E8FF",
                    background: "#FFFFFF",
                    color: "#0273F9",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Create Receipt
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const exportReceiptsToCsv = (rows) => {
  if (!rows.length) {
    return;
  }

  const headers = [
    "Receipt Number",
    "Invoice",
    "Date",
    "Type",
    "Preview URL",
    "PDF URL",
  ];

  const csvRows = rows.map((receipt) => {
    const values = [
      getReceiptNumber(receipt),
      getReceiptInvoiceId(receipt),
      formatDate(getReceiptDate(receipt)),
      getReceiptType(receipt),
      getReceiptPreviewUrl(receipt),
      getReceiptPdfUrl(receipt),
    ];

    return values
      .map((value) => `"${`${value ?? ""}`.replaceAll('"', '""')}"`)
      .join(",");
  });

  const csvContent = [headers.join(","), ...csvRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const exportUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = exportUrl;
  link.setAttribute("download", "receipts-export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(exportUrl);
};

const exportOrdersToCsv = (rows, activeTab) => {
  if (!rows.length) {
    return;
  }

  const headers = [
    "Order Number",
    "Customer Name",
    "Customer Email",
    "Date",
    "Type",
    "Items",
    "Total",
    "Payment Status",
    "Order Status",
  ];

  const csvRows = rows.map((order) => {
    const typeConfig = getTypeConfig(order, activeTab);
    const values = [
      getOrderNumber(order),
      getCustomerName(order),
      getCustomerEmail(order),
      formatDate(getOrderDate(order)),
      typeConfig.label,
      getItemsCount(order),
      getOrderTotal(order),
      titleize(
        order?.payment_status ||
          order?.payment_transaction?.status ||
          order?.payment?.status ||
          "pending"
      ),
      titleize(order?.status || order?.order_status || "pending"),
    ];

    return values
      .map((value) => `"${`${value ?? ""}`.replaceAll('"', '""')}"`)
      .join(",");
  });

  const csvContent = [headers.join(","), ...csvRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const exportUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = exportUrl;
  link.setAttribute("download", `${activeTab}-export.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(exportUrl);
};

const Orders = () => {
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const localStoreId = localStorage.getItem("itemId");
  const fallbackStoreId = useSelector((state) => state.store?.myStore?.onlineStore?.id);
  const onlineStoreId = localStoreId || fallbackStoreId || "";
  const {
    loading,
    error,
    receiptsLoading,
    receiptsError,
    receiptsData,
    receiptDetailsLoading,
    receiptDetailsError,
    receiptDetails,
    ordersData,
    orderDetails,
    orderDetailsLoading,
    orderDetailsError,
    orderStatusUpdating,
  } = useSelector((state) => state.order);

  const [activeTab, setActiveTab] = useState("orders");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showReceiptView, setShowReceiptView] = useState(false);
  const [showCreateReceipt, setShowCreateReceipt] = useState(false);
  const [receiptPage, setReceiptPage] = useState(1);
  const [receiptSearchInput, setReceiptSearchInput] = useState("");
  const [receiptSearch, setReceiptSearch] = useState("");
  const [receiptStatus, setReceiptStatus] = useState("");
  const [receiptStartDate, setReceiptStartDate] = useState("");
  const [receiptEndDate, setReceiptEndDate] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const isOrdersTab = activeTab === "orders";
  const currentEmptyState = EMPTY_STATE_CONTENT[activeTab];
  const resolvedOrderType = isOrdersTab ? "product_order" : "booking_order";
  const orders = ordersData?.data || [];
  const pagination = ordersData?.pagination || {};
  const receipts = receiptsData?.data || [];
  const receiptsPagination = receiptsData?.pagination || {};
  const resolvedOrderDetails =
    orderDetails && `${orderDetails?.id}` === `${selectedOrderId}` ? orderDetails : null;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setReceiptSearch(receiptSearchInput.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [receiptSearchInput]);

  useEffect(() => {
    if (!token || !onlineStoreId) {
      return;
    }

    dispatch(
      getOnlineStoreOrders({
        token,
        online_store_id: onlineStoreId || '7',
        status,
        payment_status: paymentStatus,
        start_date: startDate,
        end_date: endDate,
        order_type: resolvedOrderType,
        search,
        page: currentPage,
        limit: 10,
      })
    );
  }, [
    currentPage,
    dispatch,
    endDate,
    onlineStoreId,
    paymentStatus,
    resolvedOrderType,
    search,
    startDate,
    status,
    token,
  ]);

  useEffect(() => {
    if (!selectedOrderId || !token || activeTab !== "orders") {
      return;
    }

    dispatch(
      getOnlineStoreOrderDetails({
        token,
        id: selectedOrderId,
      })
    );
  }, [activeTab, dispatch, selectedOrderId, token]);

  useEffect(() => {
    if (!showReceiptView || !token || activeTab !== "orders") {
      return;
    }

    dispatch(
      getReceipts({
        token,
        search: receiptSearch,
        status: receiptStatus,
        start_date: receiptStartDate,
        end_date: receiptEndDate,
        page: receiptPage,
        limit: 10,
      })
    );
  }, [
    activeTab,
    dispatch,
    receiptEndDate,
    receiptPage,
    receiptSearch,
    receiptStartDate,
    receiptStatus,
    showReceiptView,
    token,
  ]);

  const handleExport = () => {
    exportOrdersToCsv(orders, activeTab);
  };

  const handleViewReceipt = () => {
    setShowReceiptView(true);
  };

  const handleOpenOrderDetails = (orderId) => {
    if (!orderId || activeTab !== "orders") {
      return;
    }

    setSelectedOrderId(orderId);
  };

  const handleBackToOrders = () => {
    setSelectedOrderId(null);
    dispatch(resetOrderDetails());
  };

  const handleBackFromReceiptView = () => {
    setShowReceiptView(false);
    setShowCreateReceipt(false);
    setSelectedReceipt(null);
    dispatch(resetReceiptDetails());
  };

  const handleCreateReceipt = () => {
    setShowCreateReceipt(true);
  };

  const handleBackFromCreateReceipt = () => {
    setShowCreateReceipt(false);
  };

  const handleReceiptCreated = () => {
    setReceiptPage(1);

    if (!token) {
      return;
    }

    dispatch(
      getReceipts({
        token,
        search: receiptSearch,
        status: receiptStatus,
        start_date: receiptStartDate,
        end_date: receiptEndDate,
        page: 1,
        limit: 10,
      })
    );
  };

  const handleExportReceipts = () => {
    exportReceiptsToCsv(receipts);
  };

  const handleOpenReceiptDetails = async (receipt) => {
    if (!token || !receipt?.id) {
      return;
    }

    setSelectedReceipt(receipt);

    try {
      await dispatch(
        getReceiptDetails({
          token,
          receiptId: receipt.id,
        })
      ).unwrap();
    } catch (receiptError) {
      console.error("Failed to fetch receipt details:", receiptError);
    }
  };

  const handleCloseReceiptDetails = () => {
    setSelectedReceipt(null);
    dispatch(resetReceiptDetails());
  };

  const handlePrintOrder = () => {
    if (!resolvedOrderDetails) {
      return;
    }

    const printWindow = window.open("", "_blank", "width=960,height=900");

    if (!printWindow) {
      return;
    }

    printWindow.document.open();
    printWindow.document.write(createOrderPrintMarkup(resolvedOrderDetails));
    printWindow.document.close();

    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  const handleUpdateOrderStatus = async () => {
    if (!resolvedOrderDetails?.id || !token) {
      return;
    }

    const currentStatus = `${resolvedOrderDetails?.status || ""}`.toLowerCase();
    const optionsMarkup = ORDER_STATUS_UPDATE_OPTIONS.map(
      (option) =>
        `<option value="${option.value}" ${
          option.value === currentStatus ? "selected" : ""
        }>${option.label}</option>`
    ).join("");

    const result = await Swal.fire({
      html: `
        <div style="text-align:left;">
          <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1f2937;">
            Update Order Status
          </p>
          <label for="swal-order-status" style="display:block;font-size:13px;font-weight:600;margin-bottom:8px;color:#1f2937;">
            Status
          </label>
          <select
            id="swal-order-status"
            class="swal2-select"
            style="display:flex;width:100%;margin:0;height:44px;font-size:14px;border-radius:10px;"
          >
            ${optionsMarkup}
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Update Status",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#0273F9",
      focusConfirm: false,
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const nextStatus =
          document.getElementById("swal-order-status")?.value?.trim() || "";

        if (!nextStatus) {
          Swal.showValidationMessage("Please select a status.");
          return false;
        }

        const action = await dispatch(
          updateOnlineStoreOrderStatus({
            token,
            id: resolvedOrderDetails.id,
            status: nextStatus,
          })
        );

        if (updateOnlineStoreOrderStatus.rejected.match(action)) {
          Swal.showValidationMessage(
            action?.payload?.message ||
              action?.payload?.error ||
              "Failed to update order status."
          );
          return false;
        }

        return action.payload;
      },
      allowOutsideClick: () => !Swal.isLoading(),
    });

    if (result.isConfirmed) {
      Swal.fire({
        icon: "success",
        title: "Status updated",
        text: "The order status has been updated successfully.",
        confirmButtonText: "OK",
      });
    }
  };

  if (selectedOrderId && activeTab === "orders") {
    return (
      <OrderDetailsView
        order={resolvedOrderDetails}
        loading={orderDetailsLoading || !resolvedOrderDetails}
        error={orderDetailsError}
        onBack={handleBackToOrders}
        onPrint={handlePrintOrder}
        onUpdateStatus={handleUpdateOrderStatus}
        statusUpdating={orderStatusUpdating}
      />
    );
  }

  if (showReceiptView && activeTab === "orders") {
    if (showCreateReceipt) {
      return (
        <CreateReceiptView
          onBack={handleBackFromCreateReceipt}
          onCreated={handleReceiptCreated}
        />
      );
    }

    return (
      <ReceiptManagementView
        onBack={handleBackFromReceiptView}
        onCreateReceipt={handleCreateReceipt}
        onExport={handleExportReceipts}
        onOpenReceiptDetails={handleOpenReceiptDetails}
        onCloseReceiptDetails={handleCloseReceiptDetails}
        loading={receiptsLoading}
        error={receiptsError}
        receipts={receipts}
        selectedReceipt={selectedReceipt}
        receiptDetailsLoading={receiptDetailsLoading}
        receiptDetailsError={receiptDetailsError}
        receiptDetails={receiptDetails}
        searchInput={receiptSearchInput}
        onSearchInputChange={(value) => {
          setReceiptSearchInput(value);
          setReceiptPage(1);
        }}
        status={receiptStatus}
        onStatusChange={(value) => {
          setReceiptStatus(value);
          setReceiptPage(1);
        }}
        startDate={receiptStartDate}
        onStartDateChange={(value) => {
          setReceiptStartDate(value);
          setReceiptPage(1);
        }}
        endDate={receiptEndDate}
        onEndDateChange={(value) => {
          setReceiptEndDate(value);
          setReceiptPage(1);
        }}
        pagination={receiptsPagination}
        onPageChange={setReceiptPage}
      />
    );
  }

  return (
    <div>
      <div
        className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3"
        style={{ marginBottom: "18px" }}
      >
        <div>
          <h5 className="mb-1" style={{ color: "#1C1917", fontWeight: 700 }}>
            Manage Orders & Bookings
          </h5>
          <p className="mb-0" style={{ color: "#78716C" }}>
            Track and manage customer orders and booked services.
          </p>
        </div>

        <Button
          variant="blueButton"
          size="md"
          className="px-4"
          onClick={handleViewReceipt}
          style={{ minWidth: "138px" }}
        >
          View Receipt
        </Button>
      </div>

      <div
        className="d-inline-flex"
        style={{
          background: "transparent",
          border: "1px solid #E7E5E4",
          borderRadius: "20px",
          padding: "2px",
          marginBottom: "18px",
          overflow: "hidden",
        }}
      >
        <Button
          unstyled
          onClick={() => {
            setActiveTab("orders");
            setCurrentPage(1);
            setSelectedOrderId(null);
            dispatch(resetOrderDetails());
            setShowReceiptView(false);
            setShowCreateReceipt(false);
          }}
          aria-pressed={isOrdersTab}
          style={{
            minWidth: "140px",
            padding: "10px 20px",
            border: isOrdersTab ? "1px solid #eee" : "1px solid transparent",
            borderRadius: "20px",
            background: isOrdersTab ? "#FFFFFF" : "transparent",
            color: isOrdersTab ? "#0273F9" : "#78716C",
            fontWeight: isOrdersTab ? 600 : 500,
          }}
        >
          Orders
        </Button>
        <Button
          unstyled
          onClick={() => {
            setActiveTab("bookings");
            setCurrentPage(1);
            setSelectedOrderId(null);
            dispatch(resetOrderDetails());
            setShowReceiptView(false);
            setShowCreateReceipt(false);
          }}
          aria-pressed={!isOrdersTab}
          style={{
            minWidth: "150px",
            padding: "10px 20px",
            border: !isOrdersTab ? "1px solid #eee" : "1px solid transparent",
            borderRadius: "20px",
            background: !isOrdersTab ? "#FFFFFF" : "transparent",
            color: !isOrdersTab ? "#0273F9" : "#78716C",
            fontWeight: !isOrdersTab ? 600 : 500,
          }}
        >
          Service Bookings
        </Button>
      </div>

      <div
        className="card shadow-sm"
        style={{
          border: "1px solid #EEEEEE",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <div className="card-body p-0">
          <div
            className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3"
            style={{ padding: "18px 16px" }}
          >
            <h6 className="mb-0" style={{ color: "#1C1917", fontSize: "16px" }}>
              {currentEmptyState.title}
            </h6>

            <div className="d-flex flex-wrap gap-2">
              <select
                value={paymentStatus}
                onChange={(event) => {
                  setPaymentStatus(event.target.value);
                  setCurrentPage(1);
                }}
                className={`form-select ${stylesItem["input-item"]}`}
                style={{ width: "150px", background: "#FFFFFF", fontSize: "12px" }}
              >
                {PAYMENT_OPTIONS.map((option) => (
                  <option key={option.value || "all-payment"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                unstyled
                onClick={handleExport}
                disabled={!orders.length}
                style={{
                  minWidth: "84px",
                  padding: "12px 18px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  background: "#FFFFFF",
                  color: "#1C1917",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Export
              </Button>
            </div>
          </div>
          <hr className="m-0" />

          <div className="p-3">
            <div className="row g-3 align-items-center mb-3">
              <div className="col-12 col-xl-4">
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(event) => {
                      setSearchInput(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={`Search for ${isOrdersTab ? "orders" : "bookings"}`}
                    className={`form-control ${stylesItem["input-item"]}`}
                    style={{ paddingRight: "42px", background: "#FFFFFF" }}
                  />
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9CA3AF",
                    }}
                  />
                </div>
              </div>

              <div className="col-12 col-xl-8">
                <div className="d-flex flex-wrap justify-content-xl-end gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => {
                      setStartDate(event.target.value);
                      setCurrentPage(1);
                    }}
                    className={`form-control ${stylesItem["input-item"]}`}
                    style={{ width: "170px", background: "#FFFFFF", fontSize: "12px" }}
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => {
                      setEndDate(event.target.value);
                      setCurrentPage(1);
                    }}
                    className={`form-control ${stylesItem["input-item"]}`}
                    style={{ width: "170px", background: "#FFFFFF", fontSize: "12px" }}
                  />
                  <select
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value);
                      setCurrentPage(1);
                    }}
                    className={`form-select ${stylesItem["input-item"]}`}
                    style={{ width: "160px", background: "#FFFFFF", fontSize: "12px" }}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value || "all-status"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {!onlineStoreId && (
              <div
                className="rounded-3 mb-3"
                style={{
                  border: "1px solid #FDE68A",
                  background: "#FFFBEB",
                  color: "#92400E",
                  padding: "12px 14px",
                  fontSize: "14px",
                }}
              >
                Select or set up an online store first before loading orders.
              </div>
            )}

            {error && (
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
                {error?.message || error?.error || "Unable to load orders right now."}
              </div>
            )}

            {loading && !orders.length ? (
              <div
                className="d-flex align-items-center justify-content-center"
                style={{
                  minHeight: "240px",
                  border: "1px dashed #D6D3D1",
                  borderRadius: "10px",
                  background: "#FFFFFF",
                }}
              >
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : orders.length ? (
              <>
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead style={{ background: "#FFFFFF" }}>
                      <tr>
                        <th
                          style={{
                            fontSize: "14px",
                            color: "#111827",
                            borderBottom: "1px solid #E5E7EB",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Order #
                        </th>
                        <th
                          style={{
                            fontSize: "14px",
                            color: "#111827",
                            borderBottom: "1px solid #E5E7EB",
                          }}
                        >
                          Customer Name
                        </th>
                        <th
                          style={{
                            fontSize: "14px",
                            color: "#111827",
                            borderBottom: "1px solid #E5E7EB",
                          }}
                        >
                          Date
                        </th>
                        <th
                          style={{
                            fontSize: "14px",
                            color: "#111827",
                            borderBottom: "1px solid #E5E7EB",
                          }}
                        >
                          Type
                        </th>
                        <th
                          style={{
                            fontSize: "14px",
                            color: "#111827",
                            borderBottom: "1px solid #E5E7EB",
                          }}
                        >
                          Items
                        </th>
                        <th
                          style={{
                            fontSize: "14px",
                            color: "#111827",
                            borderBottom: "1px solid #E5E7EB",
                          }}
                        >
                          Total
                        </th>
                        <th
                          style={{
                            fontSize: "14px",
                            color: "#111827",
                            borderBottom: "1px solid #E5E7EB",
                          }}
                        >
                          Payment
                        </th>
                        <th
                          style={{
                            fontSize: "14px",
                            color: "#111827",
                            borderBottom: "1px solid #E5E7EB",
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            width: "42px",
                            borderBottom: "1px solid #E5E7EB",
                          }}
                        />
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const typeConfig = getTypeConfig(order, activeTab);
                        const paymentLabel = titleize(
                          order?.payment_status ||
                            order?.payment_transaction?.status ||
                            order?.payment?.status ||
                            "pending"
                        );
                        const statusLabel = titleize(order?.status || order?.order_status || "pending");

                        return (
                          <tr
                            key={order?.id || getOrderNumber(order)}
                            onClick={() => handleOpenOrderDetails(order?.id)}
                            style={{ cursor: isOrdersTab ? "pointer" : "default" }}
                          >
                            <td
                              style={{
                                fontSize: "14px",
                                color: "#374151",
                                paddingTop: "18px",
                                paddingBottom: "18px",
                                borderBottom: "1px solid #F3F4F6",
                              }}
                            >
                              {getOrderNumber(order)}
                            </td>
                            <td
                              style={{
                                paddingTop: "10px",
                                paddingBottom: "10px",
                                borderBottom: "1px solid #F3F4F6",
                              }}
                            >
                              <p
                                className="mb-1"
                                style={{ fontSize: "16px", fontWeight: 600, color: "#1F2937" }}
                              >
                                {getCustomerName(order)}
                              </p>
                              <p className="mb-0" style={{ fontSize: "14px", color: "#78716C" }}>
                                {getCustomerEmail(order)}
                              </p>
                            </td>
                            <td
                              style={{
                                fontSize: "14px",
                                color: "#374151",
                                borderBottom: "1px solid #F3F4F6",
                              }}
                            >
                              {formatDate(getOrderDate(order))}
                            </td>
                            <td style={{ borderBottom: "1px solid #F3F4F6" }}>
                              <span
                                className={`${stylesItem["status-btn"]} ${typeConfig.className}`}
                              >
                                {typeConfig.label}
                              </span>
                            </td>
                            <td
                              style={{
                                fontSize: "14px",
                                color: "#374151",
                                borderBottom: "1px solid #F3F4F6",
                              }}
                            >
                              {getItemsCount(order)}
                            </td>
                            <td
                              style={{
                                fontSize: "14px",
                                color: "#1F2937",
                                fontWeight: 500,
                                borderBottom: "1px solid #F3F4F6",
                              }}
                            >
                              {formatCurrency(getOrderTotal(order))}
                            </td>
                            <td style={{ borderBottom: "1px solid #F3F4F6" }}>
                              <span
                                className={`${stylesItem["status-btn"]} ${getPaymentClassName(
                                  paymentLabel
                                )}`}
                              >
                                {paymentLabel}
                              </span>
                            </td>
                            <td style={{ borderBottom: "1px solid #F3F4F6" }}>
                              <span
                                className={`${stylesItem["status-btn"]} ${getOrderStatusClassName(
                                  statusLabel
                                )}`}
                              >
                                {statusLabel}
                              </span>
                            </td>
                            <td style={{ borderBottom: "1px solid #F3F4F6" }}>
                              <Button
                                unstyled
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleOpenOrderDetails(order?.id);
                                }}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  color: "#374151",
                                  padding: "4px 8px",
                                }}
                                title="Open order details"
                              >
                                <FontAwesomeIcon icon={faEllipsisV} />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={pagination?.page || currentPage}
                  totalPages={pagination?.total_pages || 1}
                  onPageChange={setCurrentPage}
                  itemsPerPage={pagination?.limit || 10}
                  totalItems={pagination?.total_items || orders.length}
                  disabled={loading}
                  className="px-1 pb-1"
                />
              </>
            ) : (
              <div
                className="d-flex flex-column align-items-center justify-content-center text-center"
                style={{
                  minHeight: "240px",
                  border: "1px dashed #D6D3D1",
                  borderRadius: "10px",
                  background: "#FFFFFF",
                  padding: "32px 20px",
                }}
              >
                <FontAwesomeIcon
                  icon={currentEmptyState.icon}
                  style={{ color: "#0F172A", fontSize: "22px", marginBottom: "12px" }}
                />
                <p
                  className="mb-1"
                  style={{ color: "#1C1917", fontSize: "15px", fontWeight: 500 }}
                >
                  {currentEmptyState.heading}
                </p>
                <p className="mb-0" style={{ color: "#78716C", fontSize: "14px" }}>
                  {currentEmptyState.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
