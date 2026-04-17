import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Swal from "sweetalert2";
import { proceedToPayment } from "../../slice/customerFacingSlice";
import styles from "../../styles.module.css";
import Button from "../../components/ui/Button";
import { buildCustomerThemeStyle, readStoredCustomerTheme } from "../customerTheme";

const PAYMENT_CONTEXT_KEY = "mycroshop.paymentContext";

const formatNaira = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return String(value);
  const hasDecimals = numberValue % 1 !== 0;
  return `₦${numberValue.toLocaleString("en-NG", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  })}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getResponseData = (response) => response?.data ?? response ?? null;

const resolveOrder = (response) => {
  const data = getResponseData(response);
  if (!data) return null;
  return data?.order ?? data?.data?.order ?? data;
};

const resolveItems = (response, order) => {
  const data = getResponseData(response);
  const items =
    order?.OnlineStoreOrderItems ??
    data?.OnlineStoreOrderItems ??
    data?.order?.OnlineStoreOrderItems ??
    data?.onlineStoreOrderItems ??
    data?.online_store_order_items ??
    order?.onlineStoreOrderItems ??
    order?.online_store_order_items ??
    order?.items ??
    order?.order_items ??
    data?.items ??
    data?.order_items ??
    data?.data?.items ??
    [];

  return Array.isArray(items) ? items : [];
};

const resolveOrderId = (order, data) =>
  order?.order_number ??
  data?.order_number ??
  order?.id ??
  order?.order_id ??
  data?.order_id ??
  data?.id ??
  null;

const resolvePaymentOrderId = (order, data) =>
  order?.id ??
  order?.order_id ??
  data?.order_id ??
  data?.id ??
  null;

const resolveProvidedTotal = (order, data) =>
  order?.total ??
  order?.total_amount ??
  order?.grand_total ??
  order?.amount ??
  data?.total ??
  data?.total_amount ??
  data?.grand_total ??
  data?.amount;

const resolveItemsTotal = (items) =>
  items.reduce((sum, item) => {
    const quantity = Math.max(1, toNumber(item?.quantity, 1));
    const itemTotal = item?.total ?? item?.total_price ?? item?.subtotal;
    if (itemTotal !== undefined && itemTotal !== null && itemTotal !== "") {
      return sum + toNumber(itemTotal);
    }
    return sum + quantity * toNumber(item?.unit_price ?? item?.price);
  }, 0);

const OrderDetails = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { checkoutResponse, loading } = useSelector((state) => state.customer);
  const token = localStorage.getItem("token");
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      return null;
    }
  }, []);

  const orderResponse = location.state?.orderResponse ?? checkoutResponse;
  const storeName = location.state?.storeName ?? "Mycroshop";
  const customerThemeStyle = useMemo(
    () => buildCustomerThemeStyle(readStoredCustomerTheme()),
    []
  );

  const {
    order,
    items,
    orderId,
    subtotal,
    shippingAmount,
    discountAmount,
    totalAmount,
    customerName,
    customerEmail,
    customerPhone,
    status,
    createdAt,
    paymentMethod,
    paymentOrderId,
    tenantId,
    currency,
    addressLines,
  } = useMemo(() => {
    const data = getResponseData(orderResponse);
    const nextOrder = resolveOrder(orderResponse);
    const nextItems = resolveItems(orderResponse, nextOrder);
    const nextItemsTotal = resolveItemsTotal(nextItems);
    const nextSubtotal =
      nextOrder?.subtotal ??
      nextOrder?.subtotal_amount ??
      nextOrder?.sub_total ??
      data?.subtotal ??
      data?.subtotal_amount ??
      data?.sub_total ??
      nextItemsTotal;

    const nextShippingAmount =
      nextOrder?.shipping_amount ?? data?.shipping_amount ?? 0;
    const nextDiscountAmount =
      nextOrder?.discount_amount ?? data?.discount_amount ?? 0;
    const providedTotal = resolveProvidedTotal(nextOrder, data);
    const nextTotalAmount =
      providedTotal !== undefined && providedTotal !== null && providedTotal !== ""
        ? toNumber(providedTotal)
        : toNumber(nextSubtotal) + toNumber(nextShippingAmount) - toNumber(nextDiscountAmount);

    const nextAddressParts = [
      nextOrder?.customer_address ?? data?.customer_address,
      nextOrder?.city ?? data?.city,
      nextOrder?.state ?? data?.state,
      nextOrder?.country ?? data?.country,
    ].filter(Boolean);

    return {
      order: nextOrder,
      items: nextItems,
      orderId: resolveOrderId(nextOrder, data),
      subtotal: toNumber(nextSubtotal),
      shippingAmount: toNumber(nextShippingAmount),
      discountAmount: toNumber(nextDiscountAmount),
      totalAmount: nextTotalAmount,
      customerName: nextOrder?.customer_name ?? data?.customer_name ?? "—",
      customerEmail: nextOrder?.customer_email ?? data?.customer_email ?? "—",
      customerPhone: nextOrder?.customer_phone ?? data?.customer_phone ?? "—",
      status: nextOrder?.status ?? data?.status ?? "pending",
      createdAt: nextOrder?.created_at ?? data?.created_at ?? "",
      paymentMethod: nextOrder?.payment_method ?? data?.payment_method ?? "",
      paymentOrderId: resolvePaymentOrderId(nextOrder, data),
      tenantId: nextOrder?.tenant_id ?? data?.tenant_id ?? data?.tenantId ?? null,
      currency: nextOrder?.currency ?? data?.currency ?? "NGN",
      addressLines: nextAddressParts,
    };
  }, [orderResponse]);

  const normalizedStatus = String(status || "").trim().toLowerCase();
  const resolvedTenantId = tenantId ?? storedUser?.tenantId ?? null;

  const handleProceedToPayment = async () => {
    const amount = toNumber(totalAmount, NaN);

    if (!resolvedTenantId || !paymentOrderId || !Number.isFinite(amount) || amount <= 0) {
      await Swal.fire({
        icon: "error",
        title: "Payment unavailable",
        text: "We couldn't prepare this order for payment.",
        confirmButtonText: "Ok",
        confirmButtonColor: customerThemeStyle["--customer-home-button"],
      });
      return;
    }

    const callbackUrl = `${window.location.origin}/customer/payment-callback`;
    const result = await dispatch(
      proceedToPayment({
        tenant_id: resolvedTenantId,
        order_id: paymentOrderId,
        amount,
        email: customerEmail === "—" ? "" : customerEmail,
        name: customerName === "—" ? "" : customerName,
        currency: currency || "NGN",
        callback_url: callbackUrl,
        token,
      })
    );

    if (proceedToPayment.fulfilled.match(result)) {
      const authorizationUrl =
        result?.payload?.data?.authorization_url ?? result?.payload?.authorization_url ?? "";

      if (authorizationUrl) {
        try {
          localStorage.setItem(PAYMENT_CONTEXT_KEY, "product");
          sessionStorage.setItem(PAYMENT_CONTEXT_KEY, "product");
        } catch (error) {
          // Ignore storage errors
        }
        window.location.assign(authorizationUrl);
        return;
      }
    }

    const errorMessage =
      result?.payload?.message ||
      result?.payload?.error ||
      result?.error?.message ||
      "Unable to start payment for this order.";

    await Swal.fire({
      icon: "error",
      title: "Payment failed",
      text: errorMessage,
      confirmButtonText: "Try Again",
      confirmButtonColor: customerThemeStyle["--customer-home-button"],
    });
  };

  if (!orderResponse || !order) {
    return (
      <div className={styles.customerOrderPage} style={customerThemeStyle}>
        <div className={styles.customerOrderCard}>
          <p className={styles.customerOrderEyebrow}>Order</p>
          <h1 className={styles.customerOrderTitle}>No order details found</h1>
          <p className={styles.customerOrderEmpty}>
            Create an order from checkout to view the full order summary here.
          </p>
          <div className={styles.customerOrderActions}>
            <Button
              className={styles.customerOrderPrimaryButton}
              type="button"
              onClick={() => navigate("/customer/checkout")}
              unstyled
            >
              Go to Checkout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.customerOrderPage} style={customerThemeStyle}>
      <div className={styles.customerOrderCard}>
        <div className={styles.customerOrderHeader}>
          <div>
            <p className={styles.customerOrderEyebrow}>{storeName}</p>
            <h1 className={styles.customerOrderTitle}>Order details</h1>
          </div>
          <span
            className={`${styles.customerOrderStatus} ${
              normalizedStatus === "pending" ? styles.customerOrderStatusPending : ""
            }`.trim()}
          >
            {String(status).replace(/_/g, " ")}
          </span>
        </div>

        <div className={styles.customerOrderMetaGrid}>
          <div className={styles.customerOrderMetaCard}>
            <span className={styles.customerOrderMetaLabel}>Order ID</span>
            <strong className={styles.customerOrderMetaValue}>
              {orderId ?? "—"}
            </strong>
          </div>
          <div className={styles.customerOrderMetaCard}>
            <span className={styles.customerOrderMetaLabel}>Created</span>
            <strong className={styles.customerOrderMetaValue}>
              {formatDate(createdAt)}
            </strong>
          </div>
          <div className={styles.customerOrderMetaCard}>
            <span className={styles.customerOrderMetaLabel}>Payment</span>
            <strong className={styles.customerOrderMetaValue}>
              {paymentMethod || "—"}
            </strong>
          </div>
        </div>

        <section className={styles.customerOrderSection}>
          <h2 className={styles.customerOrderSectionTitle}>Customer</h2>
          <div className={styles.customerOrderInfoGrid}>
            <div className={styles.customerOrderInfoCard}>
              <span className={styles.customerOrderMetaLabel}>Name</span>
              <strong className={styles.customerOrderMetaValue}>{customerName}</strong>
            </div>
            <div className={styles.customerOrderInfoCard}>
              <span className={styles.customerOrderMetaLabel}>Email</span>
              <strong className={styles.customerOrderMetaValue}>{customerEmail}</strong>
            </div>
            <div className={styles.customerOrderInfoCard}>
              <span className={styles.customerOrderMetaLabel}>Phone</span>
              <strong className={styles.customerOrderMetaValue}>{customerPhone}</strong>
            </div>
          </div>
          <div className={styles.customerOrderAddressCard}>
            <span className={styles.customerOrderMetaLabel}>Delivery address</span>
            <strong className={styles.customerOrderMetaValue}>
              {addressLines.length ? addressLines.join(", ") : "—"}
            </strong>
          </div>
        </section>

        <section className={styles.customerOrderSection}>
          <h2 className={styles.customerOrderSectionTitle}>Items</h2>
          <div className={styles.customerOrderTableWrap}>
            {items.length ? (
              <table className={styles.customerOrderTable}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const itemName =
                      item?.product_name ??
                      item?.name ??
                      item?.title ??
                      item?.Product?.name ??
                      item?.product?.name ??
                      `Item ${index + 1}`;
                    const quantity = Math.max(1, toNumber(item?.quantity, 1));
                    const unitPrice = toNumber(item?.unit_price ?? item?.price);
                    const totalPrice =
                      item?.total ?? item?.total_price ?? item?.subtotal ?? quantity * unitPrice;
                    const variationLabel =
                      item?.variation_name && item?.variation_option_value
                        ? `${item.variation_name}: ${item.variation_option_value}`
                        : item?.variation_option_value || "—";

                    return (
                      <tr
                        key={`${item?.id ?? item?.product_id ?? itemName}-${index}`}
                      >
                        <td>
                          <div>{itemName}</div>
                          <small className={styles.customerOrderTableSubtext}>
                            {variationLabel}
                          </small>
                        </td>
                        <td>{quantity}</td>
                        <td>{formatNaira(unitPrice)}</td>
                        <td>{formatNaira(totalPrice)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className={styles.customerOrderEmpty}>No line items were returned.</p>
            )}
          </div>
        </section>

        <section className={styles.customerOrderSection}>
          <h2 className={styles.customerOrderSectionTitle}>Summary</h2>
          <div className={styles.customerOrderTotals}>
            <div className={styles.customerOrderTotalsRow}>
              <span>Subtotal</span>
              <span>{formatNaira(subtotal)}</span>
            </div>
            <div className={styles.customerOrderTotalsRow}>
              <span>Shipping</span>
              <span>{formatNaira(shippingAmount)}</span>
            </div>
            <div className={styles.customerOrderTotalsRow}>
              <span>Discount</span>
              <span>{formatNaira(discountAmount)}</span>
            </div>
            <div className={styles.customerOrderTotalsRowStrong}>
              <span>Total</span>
              <span>{formatNaira(totalAmount)}</span>
            </div>
          </div>
        </section>

        <div className={styles.customerOrderActions}>
          <Button
            className={styles.customerOrderSecondaryButton}
            type="button"
            onClick={() => navigate("/customer")}
            unstyled
          >
            Continue Shopping
          </Button>
          <Button
            className={styles.customerOrderPrimaryButton}
            type="button"
            onClick={handleProceedToPayment}
            disabled={loading}
            unstyled
          >
            {loading ? "Processing..." : "Proceed To Payment"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
