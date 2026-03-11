import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { checkoutProduct, getOnlineEcommerceStore } from "../../slice/customerFacingSlice";
import styles from "../../styles.module.css";
import Button from "../../components/ui/Button";

const CART_KEY = "mycroshop.cart";
const SHIPPING_FEE = 8;
const DUTIES_FEE = 1;

const readCartItems = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const writeCartItems = (items) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (error) {
    // Ignore storage errors
  }
};

const normalizeCartItems = (items) => {
  const map = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const key = `${item?.id ?? "item"}::${item?.size ?? ""}`;
    const existing = map.get(key);
    if (existing) {
      map.set(key, {
        ...existing,
        quantity: (existing.quantity || 0) + (Number(item?.quantity) || 0),
      });
    } else {
      map.set(key, { ...item, quantity: Number(item?.quantity) || 1 });
    }
  });
  return Array.from(map.values());
};

const formatNaira = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return String(value);
  const hasDecimals = numberValue % 1 !== 0;
  return `₦${numberValue.toLocaleString("en-NG", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  })}`;
};

const generateIdempotencyKey = (length = 12) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
  }
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const storedStoreSlug = localStorage.getItem("storeView");
  const { content, checkoutLoading } = useSelector((state) => state.customer);
  const storeData = content?.data?.store;
  const storeName = storeData?.store_name || "Awesome Store";
  const resolvedStoreSlug =
    storedStoreSlug || storeData?.store_slug || storeData?.slug || storeData?.store_name || "";
  const onlineStoreId =
    storeData?.id ?? storeData?.store_id ?? storeData?.online_store_id ?? null;
  const tenantId = user?.tenantId ?? null;
  const [cartItems, setCartItems] = useState(() => readCartItems());
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const [billing, setBilling] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    country: "",
    state: "",
    city: "",
    phone: "",
  });
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const sizes = ["8", "16", "18"];
  const cartCount = useMemo(() => cartItems.length, [cartItems]);
  const cartSubtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + (Number(item?.unitPrice) || 0) * (Number(item?.quantity) || 0),
        0
      ),
    [cartItems]
  );

  useEffect(() => {
    setIdempotencyKey(generateIdempotencyKey(12));
  }, []);

  useEffect(() => {
    if (!storeData && token && tenantId && resolvedStoreSlug) {
      dispatch(getOnlineEcommerceStore({ token, tenant_id: tenantId, store: resolvedStoreSlug }));
    }
  }, [dispatch, storeData, token, tenantId, resolvedStoreSlug]);
  const feesTotal = cartCount ? SHIPPING_FEE + DUTIES_FEE : 0;
  const orderTotal = cartSubtotal + feesTotal;

  const updateCart = (updater) => {
    setCartItems((prev) => {
      const next = normalizeCartItems(updater(prev));
      writeCartItems(next);
      return next;
    });
  };

  const handleClearCart = () => updateCart(() => []);

  const handleRemoveItem = (itemId, size) => {
    updateCart((prev) =>
      prev.filter((item) => !(item.id === itemId && (item.size || "") === (size || "")))
    );
  };

  const handleQuantityChange = (itemId, size, delta) => {
    updateCart((prev) =>
      prev.map((item) => {
        if (item.id === itemId && (item.size || "") === (size || "")) {
          const nextQuantity = Math.max(1, (Number(item.quantity) || 1) + delta);
          return { ...item, quantity: nextQuantity };
        }
        return item;
      })
    );
  };

  const handleSizeChange = (itemId, size, nextSize) => {
    updateCart((prev) =>
      prev.map((item) => {
        if (item.id === itemId && (item.size || "") === (size || "")) {
          return { ...item, size: nextSize };
        }
        return item;
      })
    );
  };

  const updateBillingField = (field, value) => {
    setBilling((prev) => ({ ...prev, [field]: value }));
  };

  const buildCheckoutItems = () =>
    cartItems.map((item) => ({
      product_id: item?.product_id ?? item?.id ?? null,
      quantity: Math.max(1, Number(item?.quantity) || 1),
      unit_price: Math.max(0, Number(item?.unitPrice) || 0),
      variation_id: item?.variation_id ?? item?.variationId ?? null,
      variation_option_id: item?.variation_option_id ?? item?.variationOptionId ?? null,
    }));

  const handleCheckoutOrder = async () => {
    const items = buildCheckoutItems();
    const customerName = [billing.firstName, billing.lastName].filter(Boolean).join(" ").trim();
    const resolvedIdempotencyKey =
      idempotencyKey || generateIdempotencyKey(12);

    if (!items.length) {
      await Swal.fire({
        icon: "info",
        title: "Cart is empty",
        text: "Please add at least one item to your cart before checking out.",
        confirmButtonText: "Ok",
        confirmButtonColor: "#0273F9",
      });
      return;
    }
    if (!tenantId || !onlineStoreId || !resolvedStoreSlug) {
      await Swal.fire({
        icon: "error",
        title: "Store details missing",
        text: "We couldn't resolve the store information needed to place your order.",
        confirmButtonText: "Ok",
        confirmButtonColor: "#0273F9",
      });
      return;
    }
    if (!customerName || !billing.email || !billing.address || !billing.city || !billing.state || !billing.country) {
      await Swal.fire({
        icon: "warning",
        title: "Incomplete details",
        text: "Please complete your billing details before placing the order.",
        confirmButtonText: "Ok",
        confirmButtonColor: "#0273F9",
      });
      return;
    }

    const payload = {
      tenant_id: tenantId,
      online_store_id: onlineStoreId,
      customer_name: customerName,
      customer_email: billing.email,
      idempotency_key: resolvedIdempotencyKey,
      customer_phone: billing.phone || "",
      customer_address: billing.address,
      city: billing.city,
      state: billing.state,
      country: billing.country,
      items,
      tax_rate: 7.5,
      shipping_amount: cartCount ? SHIPPING_FEE : 0,
      discount_amount: 0,
    };

    const result = await dispatch(checkoutProduct({ payload, token, store: resolvedStoreSlug }));
    if (checkoutProduct.fulfilled.match(result)) {
      const orderId =
        result?.payload?.data?.order?.id ??
        result?.payload?.data?.id ??
        result?.payload?.order?.id ??
        result?.payload?.order_id ??
        null;

      if (orderId !== null && orderId !== undefined) {
        localStorage.setItem("orderId", JSON.stringify(orderId));
      }

      writeCartItems([]);
      setCartItems([]);
      await Swal.fire({
        icon: "success",
        title: "Order placed",
        text: "Your order has been created successfully.",
        confirmButtonText: "Continue",
        confirmButtonColor: "#0273F9",
      });
      navigate("/customer/order", {
        state: {
          orderResponse: result.payload,
          storeName,
        },
      });
      return;
    }

    const errorMessage =
      result?.payload?.message ||
      result?.error?.message ||
      "Unable to place your order right now.";
    await Swal.fire({
      icon: "error",
      title: "Checkout failed",
      text: errorMessage,
      confirmButtonText: "Try Again",
      confirmButtonColor: "#0273F9",
    });
  };

  return (
    <div className={styles.customerCheckoutPage}>
      <div className={styles.customerCheckoutContent}>
        <header className={styles.customerCheckoutHeader}>
          <Button
            className={styles.customerCheckoutBackButton}
            type="button"
            onClick={() => {
              if (showOrderSummary) {
                setShowOrderSummary(false);
                return;
              }
              navigate(-1);
            }}
            aria-label="Back"
            unstyled
          >
            ←
          </Button>
          <h1 className={styles.customerCheckoutTitle}>{storeName}</h1>
          <Button
            className={styles.customerCheckoutCartButton}
            type="button"
            aria-label="Cart"
            unstyled
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor">
              <path
                d="M6 6h15l-2 9H8L6 6Zm0 0L5 3H2"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="20" r="1.6" strokeWidth="2" />
              <circle cx="18" cy="20" r="1.6" strokeWidth="2" />
            </svg>
            <span className={styles.customerCheckoutCartBadge}>{cartCount}</span>
          </Button>
        </header>

        {!showOrderSummary ? (
          <>
            <div className={styles.customerCheckoutCartMeta}>
              <div className={styles.customerCheckoutCartTitle}>
                <span>Your Cart</span>
                <span className={styles.customerCheckoutCartDivider}>|</span>
                <span>
                  {cartCount} Item{cartCount === 1 ? "" : "s"}
                </span>
              </div>
              <Button
                className={styles.customerCheckoutClear}
                type="button"
                onClick={handleClearCart}
                disabled={!cartCount}
                unstyled
              >
                Clear cart
              </Button>
            </div>

            <div className={styles.customerCheckoutBody}>
              <div className={styles.customerCheckoutLeft}>
                {cartItems.length ? (
                  cartItems.map((item) => (
                    <section
                      className={styles.customerCheckoutItem}
                      key={`${item.id}-${item.size || "default"}`}
                    >
                      <img
                        className={styles.customerCheckoutItemImage}
                        src={item.image}
                        alt={item.title}
                      />
                      <div className={styles.customerCheckoutItemInfo}>
                        <div className={styles.customerCheckoutItemTop}>
                          <div>
                            <h2 className={styles.customerCheckoutItemTitle}>{item.title}</h2>
                            <span className={styles.customerCheckoutItemPrice}>
                              {item.priceLabel || formatNaira(item.unitPrice) || "Contact for price"}
                            </span>
                          </div>
                          <Button
                            className={styles.customerCheckoutTrash}
                            type="button"
                            aria-label="Remove"
                            onClick={() => handleRemoveItem(item.id, item.size)}
                            unstyled
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="18"
                              height="18"
                              fill="none"
                              stroke="currentColor"
                            >
                              <path d="M3 6h18" strokeWidth="2" strokeLinecap="round" />
                              <path d="M8 6V4h8v2" strokeWidth="2" strokeLinecap="round" />
                              <path d="M6 6l1 14h10l1-14" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </Button>
                        </div>

                        <div className={styles.customerCheckoutQuantity}>
                          <Button
                            className={styles.customerCheckoutQtyButton}
                            type="button"
                            onClick={() => handleQuantityChange(item.id, item.size, -1)}
                            unstyled
                          >
                            −
                          </Button>
                          <span className={styles.customerCheckoutQtyValue}>{item.quantity}</span>
                          <Button
                            className={styles.customerCheckoutQtyButton}
                            type="button"
                            onClick={() => handleQuantityChange(item.id, item.size, 1)}
                            unstyled
                          >
                            +
                          </Button>
                        </div>

                        <div className={styles.customerCheckoutSizeBlock}>
                          <span className={styles.customerCheckoutLabel}>Size</span>
                          <div className={styles.customerCheckoutSizeOptions}>
                            {sizes.map((option) => (
                              <Button
                                key={option}
                                className={`${styles.customerCheckoutSizeOption} ${
                                  (item.size || "16") === option
                                    ? styles.customerCheckoutSizeActive
                                    : ""
                                }`}
                                type="button"
                                onClick={() => handleSizeChange(item.id, item.size, option)}
                                unstyled
                              >
                                {option}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>
                  ))
                ) : (
                  <p className={styles.customerCheckoutEmpty}>Your cart is empty.</p>
                )}

                <section className={styles.customerCheckoutDelivery}>
                  <h2 className={styles.customerCheckoutSectionTitle}>Delivery Date</h2>

                  <label className={styles.customerCheckoutInputLabel}>
                    Choose Delivery Date
                    <div className={styles.customerCheckoutInputWrap}>
                      <input type="date" />
                    </div>
                  </label>

                  <label className={styles.customerCheckoutInputLabel}>
                    Select Delivery Time
                    <div className={styles.customerCheckoutInputWrap}>
                      <select className={styles.customerCheckoutSelect}>
                        <option value="08:00-10:00">08:00 - 10:00</option>
                        <option value="10:00-12:00">10:00 - 12:00</option>
                        <option value="12:00-14:00">12:00 - 14:00</option>
                        <option value="14:00-16:00">14:00 - 16:00</option>
                      </select>
                    </div>
                  </label>
                </section>
              </div>

              <aside className={styles.customerCheckoutRight}>
                <section className={styles.customerCheckoutTotal}>
                  <div className={styles.customerCheckoutTotalRow}>
                    <span>Total</span>
                    <span>{formatNaira(cartSubtotal)}</span>
                  </div>
                  <Button
                    className={styles.customerCheckoutCta}
                    type="button"
                    onClick={() => {
                      setShowOrderSummary(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={!cartCount}
                    unstyled
                  >
                    Proceed to Checkout
                  </Button>
                </section>
              </aside>
            </div>
          </>
        ) : (
          <>
            <section className={styles.customerCheckoutOrderSummary}>
              <h2 className={styles.customerCheckoutSectionTitle}>Order Summary</h2>
              {cartItems.length ? (
                cartItems.map((item) => (
                  <div
                    className={styles.customerCheckoutSummaryCard}
                    key={`${item.id}-${item.size || "default"}-summary`}
                  >
                    <img
                      className={styles.customerCheckoutSummaryImage}
                      src={item.image}
                      alt={item.title}
                    />
                    <div className={styles.customerCheckoutSummaryDetails}>
                      <h3>{item.title}</h3>
                      <div className={styles.customerCheckoutSummaryMeta}>
                        <span>Size:</span>
                        <span>{item.size || "N/A"}</span>
                      </div>
                      <div className={styles.customerCheckoutSummaryMeta}>
                        <span>Quantity:</span>
                        <span>{item.quantity}</span>
                      </div>
                      <div className={styles.customerCheckoutSummaryMeta}>
                        <span>Total</span>
                        <span>
                          {formatNaira((Number(item.unitPrice) || 0) * (Number(item.quantity) || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.customerCheckoutEmpty}>Your cart is empty.</p>
              )}
              <div className={styles.customerCheckoutSummaryTotal}>
                <span>Total</span>
                <span>{formatNaira(orderTotal)}</span>
              </div>
            </section>

            <section className={styles.customerCheckoutBilling}>
              <h2 className={styles.customerCheckoutSectionTitle}>Billing Address</h2>
              <form className={styles.customerCheckoutBillingForm}>
                <label>
                  First Name <span>*</span>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={billing.firstName}
                    onChange={(event) => updateBillingField("firstName", event.target.value)}
                  />
                </label>
                <label>
                  Last Name <span>*</span>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={billing.lastName}
                    onChange={(event) => updateBillingField("lastName", event.target.value)}
                  />
                </label>
                <label>
                  Email <span>*</span>
                  <input
                    type="email"
                    placeholder="Email"
                    value={billing.email}
                    onChange={(event) => updateBillingField("email", event.target.value)}
                  />
                </label>
                <label>
                  Address <span>*</span>
                  <input
                    type="text"
                    placeholder="Shipping address"
                    value={billing.address}
                    onChange={(event) => updateBillingField("address", event.target.value)}
                  />
                </label>
                <label>
                  Country <span>*</span>
                  <input
                    type="text"
                    placeholder="Country"
                    value={billing.country}
                    onChange={(event) => updateBillingField("country", event.target.value)}
                  />
                </label>
                <label>
                  State <span>*</span>
                  <input
                    type="text"
                    placeholder="State"
                    value={billing.state}
                    onChange={(event) => updateBillingField("state", event.target.value)}
                  />
                </label>
                <label>
                  City / Town <span>*</span>
                  <input
                    type="text"
                    placeholder="City / Town"
                    value={billing.city}
                    onChange={(event) => updateBillingField("city", event.target.value)}
                  />
                </label>
                <label>
                  Mobile Phone
                  <input
                    type="tel"
                    placeholder="Mobile Phone"
                    value={billing.phone}
                    onChange={(event) => updateBillingField("phone", event.target.value)}
                  />
                </label>
                <label>
                  Idempotency Key
                  <input
                    type="text"
                    placeholder="Idempotency Key"
                    value={idempotencyKey}
                    readOnly
                  />
                </label>
              </form>
            </section>

            <section className={styles.customerCheckoutBillingSummary}>
              <h2 className={styles.customerCheckoutSectionTitle}>Billing Summary</h2>
              <div className={styles.customerCheckoutBillingRows}>
                <div>
                  <span>Total Items</span>
                  <span>{formatNaira(cartSubtotal)}</span>
                </div>
                <div>
                  <span>Shipping</span>
                  <span>{formatNaira(cartCount ? SHIPPING_FEE : 0)}</span>
                </div>
                <div>
                  <span>Duties, taxes & fees</span>
                  <span>{formatNaira(cartCount ? DUTIES_FEE : 0)}</span>
                </div>
                <div className={styles.customerCheckoutBillingTotal}>
                  <span>Total Order</span>
                  <span>{formatNaira(orderTotal)}</span>
                </div>
              </div>
            </section>

            <section className={styles.customerCheckoutPayment}>
              <h2 className={styles.customerCheckoutSectionTitle}>Payment</h2>
              <p className={styles.customerCheckoutPaymentHint}>Select a payment Method</p>
              <div className={styles.customerCheckoutPaymentOptions}>
                <Button
                  className={`${styles.customerCheckoutPaymentOption} ${
                    paymentMethod === "paystack" ? styles.customerCheckoutPaymentActive : ""
                  }`}
                  type="button"
                  onClick={() => setPaymentMethod("paystack")}
                  aria-label="Paystack"
                  unstyled
                >
                  <span className={styles.customerCheckoutRadio} />
                  <img
                    className={styles.customerCheckoutPaymentLogo}
                    src="https://upload.wikimedia.org/wikipedia/commons/f/f9/Paystack_Logo.svg"
                    alt="Paystack"
                    loading="lazy"
                  />
                </Button>
                <Button
                  className={`${styles.customerCheckoutPaymentOption} ${
                    paymentMethod === "flutterwave" ? styles.customerCheckoutPaymentActive : ""
                  }`}
                  type="button"
                  onClick={() => setPaymentMethod("flutterwave")}
                  aria-label="Flutterwave"
                  unstyled
                >
                  <span className={styles.customerCheckoutRadio} />
                  <img
                    className={styles.customerCheckoutPaymentLogo}
                    src="https://upload.wikimedia.org/wikipedia/commons/9/9e/Flutterwave_Logo.png"
                    alt="Flutterwave"
                    loading="lazy"
                  />
                </Button>
              </div>

              <Button
                className={styles.customerCheckoutPayButton}
                type="button"
                onClick={handleCheckoutOrder}
                disabled={checkoutLoading}
                unstyled
              >
                {checkoutLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                      style={{ marginRight: "8px" }}
                    />
                    Processing...
                  </>
                ) : (
                  "Pay and Place Order"
                )}
              </Button>
              <p className={styles.customerCheckoutPaymentNote}>
                By clicking on “Pay and Place Order”, you agree to make your purchase from My
                Awesome as merchant of record for this transaction
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Checkout;
