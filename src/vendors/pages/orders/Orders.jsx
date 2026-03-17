import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faCalendarCheck,
  faEllipsisV,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../../components/ui/Button";
import Pagination from "../../../components/Pagination";
import { getOnlineStoreOrders } from "../../../slice/order";
import stylesItem from "../../../Tabs.module.css";

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

const getOrderNumber = (order) =>
  order?.order_number ||
  order?.reference ||
  order?.reference_no ||
  order?.invoice_number ||
  (order?.id ? `ORD-${order.id}` : "-");

const getCustomerName = (order) =>
  order?.customer_name ||
  order?.customer?.name ||
  order?.customer?.full_name ||
  order?.user?.name ||
  order?.user?.full_name ||
  "Walk-in Customer";

const getCustomerEmail = (order) =>
  order?.customer_email ||
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
        0
    ) || 0
  );
};

const getOrderTotal = (order) =>
  order?.total_amount ??
  order?.grand_total ??
  order?.total ??
  order?.amount ??
  order?.paid_amount ??
  0;

const getReceiptUrl = (order) =>
  order?.receipt_url || order?.invoice_url || order?.preview_url || "";

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
      formatDate(order?.created_at || order?.date || order?.order_date),
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
  const { loading, error, ordersData } = useSelector((state) => state.order);

  const [activeTab, setActiveTab] = useState("orders");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isOrdersTab = activeTab === "orders";
  const currentEmptyState = EMPTY_STATE_CONTENT[activeTab];
  const resolvedOrderType = isOrdersTab ? "product_order" : "service_booking";
  const orders = ordersData?.data || [];
  const pagination = ordersData?.pagination || {};
  const receiptUrl = orders.map(getReceiptUrl).find(Boolean) || "";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

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

  const handleExport = () => {
    exportOrdersToCsv(orders, activeTab);
  };

  const handleViewReceipt = () => {
    if (receiptUrl) {
      window.open(receiptUrl, "_blank", "noopener,noreferrer");
    }
  };

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
          disabled={!receiptUrl}
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
                        const rowReceiptUrl = getReceiptUrl(order);

                        return (
                          <tr key={order?.id || getOrderNumber(order)}>
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
                              {formatDate(order?.created_at || order?.date || order?.order_date)}
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
                                onClick={() => {
                                  if (rowReceiptUrl) {
                                    window.open(rowReceiptUrl, "_blank", "noopener,noreferrer");
                                  }
                                }}
                                disabled={!rowReceiptUrl}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  color: "#374151",
                                  padding: "4px 8px",
                                }}
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
