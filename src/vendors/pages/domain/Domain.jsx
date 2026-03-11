import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDispatch, useSelector } from 'react-redux';
import { getDomainPrice, getDomains, resetStatus, payForDomain } from "../../../slice/domainSlice";
import Swal from "sweetalert2";
import {
  faArrowLeft,
  faCartShopping,
  faCircleCheck,
  faCircleInfo,
  faGlobe,
  faMagnifyingGlass,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../../components/ui/Button";
import styles from "../../../styles.module.css";

const DOMAIN_CART_KEY = "mycroshop.domainCart";
const DOMAIN_PAYMENT_CONTEXT_KEY = "mycroshop.pendingDomainPayment";
const DOMAIN_PAYMENT_INFLIGHT_KEY = "mycroshop.domainPaymentInFlight";
const VENDOR_ACTIVE_TAB_KEY = "mycroshop.vendorActiveTab";
const DOMAIN_PERIOD_OPTIONS = ["1 year", "2 years", "3 years", "5 years"];
const getPricingKey = (domainName, year) => `${domainName?.toLowerCase?.() || ""}-${year}`;
const initialCheckoutForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  address1: "",
  city: "",
  state: "",
  postalCode: "",
  linkToStore: false,
};

const normalizeDomainResults = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.domains)) return payload.domains;
  if (Array.isArray(payload.results)) return payload.results;
  if (payload.data && typeof payload.data === "object") return [payload.data];
  if (typeof payload === "object") return [payload];
  return [];
};

const resolveDomainName = (domainResult) =>
  domainResult?.domain ||
  domainResult?.name ||
  domainResult?.fullDomain ||
  domainResult?.fqdn ||
  "";

const resolveAvailability = (domainResult) => {
  if (typeof domainResult?.available === "boolean") return domainResult.available;
  if (typeof domainResult?.isAvailable === "boolean") return domainResult.isAvailable;
  if (typeof domainResult?.availability === "boolean") return domainResult.availability;
  if (typeof domainResult?.status === "string") {
    return domainResult.status.toLowerCase() === "available";
  }
  return null;
};

const resolvePrice = (domainResult) =>
  domainResult?.price ||
  domainResult?.amount ||
  domainResult?.cost ||
  domainResult?.registrationPrice ||
  "";

const resolveSuggestions = (domainResult) => {
  const suggestionSources = [
    domainResult?.suggestions,
    domainResult?.similarDomains,
    domainResult?.alternatives,
    domainResult?.recommendedDomains,
  ];

  for (const source of suggestionSources) {
    if (Array.isArray(source) && source.length > 0) {
      return source;
    }
  }

  return [];
};

const readDomainCart = () => {
  if (typeof window === "undefined") return [];

  try {
    const rawCart = localStorage.getItem(DOMAIN_CART_KEY);
    if (!rawCart) return [];
    const parsedCart = JSON.parse(rawCart);
    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch {
    return [];
  }
};

const writeDomainCart = (items) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(DOMAIN_CART_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
};

const readPendingDomainPayment = () => {
  if (typeof window === "undefined") return null;

  let rawPaymentContext = "";
  let isPaymentInFlight = false;

  try {
    rawPaymentContext = localStorage.getItem(DOMAIN_PAYMENT_CONTEXT_KEY) || "";
    isPaymentInFlight = localStorage.getItem(DOMAIN_PAYMENT_INFLIGHT_KEY) === "true";
  } catch {
    return null;
  }

  if (!rawPaymentContext) {
    return null;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const paymentReference = searchParams.get("reference") || searchParams.get("trxref") || "";
  const paymentStatus = (
    searchParams.get("status") ||
    searchParams.get("payment_status") ||
    searchParams.get("paymentStatus") ||
    ""
  ).toLowerCase();
  const paystackReferrer =
    typeof document !== "undefined" &&
    typeof document.referrer === "string" &&
    document.referrer.toLowerCase().includes("paystack");
  const successfulStatuses = ["success", "successful", "paid", "completed"];

  if (!paymentReference && !successfulStatuses.includes(paymentStatus) && !(isPaymentInFlight && paystackReferrer)) {
    return null;
  }

  try {
    return rawPaymentContext ? JSON.parse(rawPaymentContext) : null;
  } catch {
    return null;
  }
};

const parsePriceValue = (price) => {
  if (price === null || price === undefined || price === "") return null;
  if (typeof price === "number") return Number.isFinite(price) ? price : null;

  const numericValue = Number(price.toString().replace(/[^0-9.]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : null;
};

const resolveFetchedPricingDetails = (payload) => {
  const data = payload?.data;
  if (!data || typeof data !== "object") {
    return {
      totalPrice: null,
      currency: "",
      years: null,
      pricePerYear: null,
      note: null,
    };
  }

  return {
    totalPrice: data.totalPrice ?? null,
    currency: data.currency || "",
    years: data.years ?? null,
    pricePerYear: data.pricePerYear ?? null,
    note: data.note ?? null,
  };
};

const formatCurrency = (value, currency = "USD") => {
  if (!Number.isFinite(value)) return "";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

const resolveRegistrationLabel = (domainName) => {
  if (!domainName || !domainName.includes(".")) {
    return "Domain registration";
  }

  const extension = domainName.split(".").pop();
  return `.${extension?.toUpperCase()} domain registration`;
};

const resolvePeriodYears = (periodLabel) => {
  const parsedYears = Number.parseInt(periodLabel, 10);
  return Number.isFinite(parsedYears) ? parsedYears : 1;
};

const Domain = () => {
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const onlineStoreId = localStorage.getItem("itemId");
  const initialPaymentSuccess = readPendingDomainPayment();
  const [showDomainSearch, setShowDomainSearch] = useState(Boolean(initialPaymentSuccess));
  const [searchInput, setSearchInput] = useState("");
  const [activeDomainQuery, setActiveDomainQuery] = useState("");
  const [searchCounter, setSearchCounter] = useState(0);
  const [cartItems, setCartItems] = useState(() =>
    initialPaymentSuccess ? [] : readDomainCart()
  );
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReviewDetails, setShowReviewDetails] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(Boolean(initialPaymentSuccess));
  const [paymentSuccessDetails, setPaymentSuccessDetails] = useState(initialPaymentSuccess);
  const [checkoutForm, setCheckoutForm] = useState(initialCheckoutForm);
  const {
    success,
    error,
    loading,
    myDomain,
    domainPricing,
    pricingStatus,
    paymentLoading,
  } = useSelector((state) => state.domain);
  const domainResults = normalizeDomainResults(myDomain);

  useEffect(() => {
    if (token && activeDomainQuery && searchCounter > 0) {
      dispatch(getDomains({ token, domain: activeDomainQuery }));
    }
  }, [activeDomainQuery, searchCounter, token, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(resetStatus());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!showCart || typeof document === "undefined") return undefined;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflow;
    };
  }, [showCart]);

  useEffect(() => {
    if (!paymentSuccessDetails || typeof window === "undefined") return;

    try {
      writeDomainCart([]);
      localStorage.removeItem(DOMAIN_PAYMENT_CONTEXT_KEY);
      localStorage.removeItem(DOMAIN_PAYMENT_INFLIGHT_KEY);
      localStorage.setItem(VENDOR_ACTIVE_TAB_KEY, "domains");
    } catch {
      // Ignore storage errors
    }

    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete("reference");
    searchParams.delete("trxref");
    searchParams.delete("status");
    const nextSearch = searchParams.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
    window.history.replaceState({}, document.title, nextUrl);
  }, [paymentSuccessDetails]);

  useEffect(() => {
    if (!token || cartItems.length === 0) return;

    cartItems.forEach((item) => {
      const year = resolvePeriodYears(item.period || DOMAIN_PERIOD_OPTIONS[0]);
      const pricingKey = getPricingKey(item.domain, year);

      if (domainPricing[pricingKey] || pricingStatus[pricingKey]?.loading || pricingStatus[pricingKey]?.error) {
        return;
      }

      dispatch(getDomainPrice({ token, domain: item.domain, year }));
    });
  }, [cartItems, dispatch, domainPricing, pricingStatus, token]);

  const isDomainInCart = (domainName) =>
    cartItems.some(
      (item) => item?.domain?.toLowerCase() === domainName.toLowerCase()
    );

  const handleAddToCart = (domainResult) => {
    const domainName = resolveDomainName(domainResult) || activeDomainQuery;
    if (!domainName || isDomainInCart(domainName)) {
      return;
    }

    setCartItems((currentItems) => {
      const nextCartItems = [
        ...currentItems,
        {
          domain: domainName,
          price: resolvePrice(domainResult),
          availability: resolveAvailability(domainResult),
          period: DOMAIN_PERIOD_OPTIONS[0],
        },
      ];

      writeDomainCart(nextCartItems);
      return nextCartItems;
    });
    setShowCart(true);
  };

  const handlePeriodChange = (domainName, nextPeriod) => {
    setCartItems((currentItems) => {
      const nextCartItems = currentItems.map((item) =>
        item?.domain?.toLowerCase() === domainName.toLowerCase()
          ? { ...item, period: nextPeriod }
          : item
      );
      writeDomainCart(nextCartItems);
      return nextCartItems;
    });
  };

  const handleRemoveFromCart = (domainName) => {
    setCartItems((currentItems) => {
      const nextCartItems = currentItems.filter(
        (item) => item?.domain?.toLowerCase() !== domainName.toLowerCase()
      );
      writeDomainCart(nextCartItems);
      return nextCartItems;
    });
  };

  const clearDomainCart = () => {
    setCartItems([]);
    writeDomainCart([]);
  };

  const handleDomainSearch = () => {
    const trimmedDomain = searchInput.trim();
    if (!trimmedDomain) {
      dispatch(resetStatus());
      return;
    }

    setActiveDomainQuery(trimmedDomain);
    setSearchCounter((current) => current + 1);
  };

  const cartPricingDetails = cartItems.map((item) => {
    const itemYear = resolvePeriodYears(item.period || DOMAIN_PERIOD_OPTIONS[0]);
    const pricingKey = getPricingKey(item.domain, itemYear);
    const pricingPayload = domainPricing[pricingKey];
    const pricingMeta = pricingStatus[pricingKey] || {};
    const pricingDetails = resolveFetchedPricingDetails(pricingPayload);
    const numericPrice = parsePriceValue(pricingDetails.totalPrice);

    return {
      ...item,
      pricingKey,
      itemYear,
      pricingError: pricingMeta.error,
      pricingLoading: Boolean(pricingMeta.loading),
      pricingCurrency: pricingDetails.currency || "USD",
      pricingYears: pricingDetails.years || itemYear,
      pricingPerYear: parsePriceValue(pricingDetails.pricePerYear),
      pricingNote: pricingDetails.note,
      numericPrice,
    };
  });

  const cartTotal = cartPricingDetails.reduce((total, item) => {
    if (!Number.isFinite(item.numericPrice)) return total;
    return total + item.numericPrice;
  }, 0);
  const visibleCartPricingDetails = showPaymentSuccess ? [] : cartPricingDetails;
  const visibleCartCount = showPaymentSuccess ? 0 : cartItems.length;
  const visibleCartTotal = showPaymentSuccess ? 0 : cartTotal;

  const isCheckoutReady =
    cartPricingDetails.length > 0 &&
    cartPricingDetails.every(
      (item) => Number.isFinite(item.numericPrice) && !item.pricingLoading && !item.pricingError
    );
  const isVisibleCheckoutReady = showPaymentSuccess ? false : isCheckoutReady;
  const checkoutCurrency =
    cartPricingDetails.find((item) => Number.isFinite(item.numericPrice))?.pricingCurrency || "USD";

  const handleCheckoutFieldChange = (fieldName, value) => {
    setCheckoutForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
  };

  const handleOpenCheckout = () => {
    if (!isCheckoutReady) {
      return;
    }

    setShowCart(false);
    setShowCheckout(true);
    setShowReviewDetails(false);
  };

  const handleOpenReviewDetails = () => {
    if (!isCheckoutReady) {
      return;
    }

    const requiredFields = [
      { key: "firstName", label: "First name" },
      { key: "lastName", label: "Last name" },
      { key: "email", label: "Email" },
      { key: "phoneNumber", label: "Phone number" },
      { key: "address1", label: "Address" },
      { key: "city", label: "City" },
      { key: "state", label: "State/Province" },
      { key: "postalCode", label: "Postal code" },
    ];

    const missingField = requiredFields.find(
      (field) => !checkoutForm[field.key]?.toString().trim()
    );

    if (missingField) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete form",
        text: `${missingField.label} is required before continuing.`,
      });
      return;
    }

    setShowReviewDetails(true);
  };

  const handleProceedToPayment = async () => {
    if (!token) {
      await Swal.fire({
        icon: "error",
        title: "Authentication required",
        text: "Please log in again before continuing with payment.",
      });
      return;
    }

    if (cartPricingDetails.length !== 1) {
      await Swal.fire({
        icon: "warning",
        title: "One domain at a time",
        text: "Domain payment currently supports one domain per checkout. Remove extra domains and try again.",
      });
      return;
    }

    const requiredFields = [
      { key: "firstName", label: "First name" },
      { key: "lastName", label: "Last name" },
      { key: "email", label: "Email" },
      { key: "phoneNumber", label: "Phone number" },
      { key: "address1", label: "Address" },
      { key: "city", label: "City" },
      { key: "state", label: "State/Province" },
      { key: "postalCode", label: "Postal code" },
    ];

    const missingField = requiredFields.find(
      (field) => !checkoutForm[field.key]?.toString().trim()
    );

    if (missingField) {
      await Swal.fire({
        icon: "warning",
        title: "Incomplete form",
        text: `${missingField.label} is required before payment.`,
      });
      return;
    }

    if (!isCheckoutReady) {
      await Swal.fire({
        icon: "warning",
        title: "Pricing still loading",
        text: "Wait for the domain price to finish loading before proceeding.",
      });
      return;
    }

    if (checkoutForm.linkToStore && !onlineStoreId) {
      await Swal.fire({
        icon: "warning",
        title: "Store not found",
        text: "Set up or select an online store before linking a domain to it.",
      });
      return;
    }

    try {
      const selectedDomain = cartPricingDetails[0];
      const callbackUrl = `${window.location.origin}/vendor/store?payment_status=success`;
      try {
        localStorage.setItem(
          DOMAIN_PAYMENT_CONTEXT_KEY,
          JSON.stringify({
            domain: selectedDomain.domain,
            period: selectedDomain.period,
          })
        );
        localStorage.setItem(DOMAIN_PAYMENT_INFLIGHT_KEY, "true");
        localStorage.setItem(VENDOR_ACTIVE_TAB_KEY, "domains");
      } catch {
        // Ignore storage errors
      }

      const response = await dispatch(
        payForDomain({
          token,
          domain: selectedDomain.domain,
          firstName: checkoutForm.firstName.trim(),
          lastName: checkoutForm.lastName.trim(),
          email: checkoutForm.email.trim(),
          phone: checkoutForm.phoneNumber.trim(),
          address1: checkoutForm.address1.trim(),
          city: checkoutForm.city.trim(),
          stateProvince: checkoutForm.state.trim(),
          postalCode: checkoutForm.postalCode.trim(),
          online_store_id: checkoutForm.linkToStore ? onlineStoreId : null,
          callback_url: callbackUrl,
        })
      ).unwrap();

      const authorizationUrl = response?.data?.payment?.authorization_url;

      if (!authorizationUrl) {
        try {
          localStorage.removeItem(DOMAIN_PAYMENT_CONTEXT_KEY);
          localStorage.removeItem(DOMAIN_PAYMENT_INFLIGHT_KEY);
        } catch {
          // Ignore storage errors
        }
        await Swal.fire({
          icon: "error",
          title: "Missing payment link",
          text: "The payment link was not returned by the server.",
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Redirecting to payment",
        text: response?.message || "Domain checkout initialized successfully.",
        confirmButtonText: "Continue",
      });

      window.location.assign(authorizationUrl);
    } catch (paymentError) {
      try {
        localStorage.removeItem(DOMAIN_PAYMENT_CONTEXT_KEY);
        localStorage.removeItem(DOMAIN_PAYMENT_INFLIGHT_KEY);
      } catch {
        // Ignore storage errors
      }
      await Swal.fire({
        icon: "error",
        title: "Unable to initialize payment",
        text:
          paymentError?.message ||
          paymentError?.error ||
          paymentError?.data?.message ||
          "Something went wrong while starting payment.",
      });
    }
  };

  const handleViewMyDomains = () => {
    clearDomainCart();
    try {
      localStorage.removeItem(DOMAIN_PAYMENT_INFLIGHT_KEY);
    } catch {
      // Ignore storage errors
    }
    setShowPaymentSuccess(false);
    setPaymentSuccessDetails(null);
    setShowDomainSearch(false);
    setShowCheckout(false);
    setShowReviewDetails(false);
    setShowCart(false);
  };

  const handleRegisterAnotherDomain = () => {
    clearDomainCart();
    try {
      localStorage.removeItem(DOMAIN_PAYMENT_INFLIGHT_KEY);
    } catch {
      // Ignore storage errors
    }
    setShowPaymentSuccess(false);
    setPaymentSuccessDetails(null);
    setShowDomainSearch(true);
    setShowCheckout(false);
    setShowReviewDetails(false);
    setShowCart(false);
    setSearchInput("");
    setActiveDomainQuery("");
  };

  const cartModal =
    showCart && typeof document !== "undefined"
      ? createPortal(
          <div
            className={styles.vendorDomainCartOverlay}
            onClick={() => setShowCart(false)}
          >
            <div
              className={styles.vendorDomainCartModal}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.vendorDomainCartModalHeader}>
                <h3 className={styles.vendorDomainCartModalTitle}>
                  Cart ({visibleCartCount} {visibleCartCount === 1 ? "Item" : "Items"})
                </h3>

                <Button
                  type="button"
                  unstyled
                  className={styles.vendorDomainCartCloseButton}
                  onClick={() => setShowCart(false)}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </Button>
              </div>

              <div className={styles.vendorDomainCartModalBody}>
                <h4 className={styles.vendorDomainCartSectionTitle}>Domain Registration</h4>

                {visibleCartPricingDetails.length === 0 ? (
                  <p className={styles.vendorDomainCartEmptyState}>
                    Your cart is empty.
                  </p>
                ) : (
                  <div className={styles.vendorDomainCartEntries}>
                    {visibleCartPricingDetails.map((item) => {
                      return (
                        <div key={item.domain} className={styles.vendorDomainCartEntryCard}>
                          <div className={styles.vendorDomainCartEntryTop}>
                            <div>
                              <h5 className={styles.vendorDomainCartEntryTitle}>{item.domain}</h5>
                              <span className={styles.vendorDomainCartEntryBadge}>
                                {resolveRegistrationLabel(item.domain)}
                              </span>
                            </div>

                            <div className={styles.vendorDomainCartEntryActions}>
                              <span className={styles.vendorDomainCartSaveBadge}>Save 30%</span>
                              <Button
                                type="button"
                                unstyled
                                className={styles.vendorDomainCartDeleteButton}
                                onClick={() => handleRemoveFromCart(item.domain)}
                                aria-label={`Remove ${item.domain} from cart`}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            </div>
                          </div>

                          <div className={styles.vendorDomainCartEntryBottom}>
                            <div className={styles.vendorDomainCartPeriodGroup}>
                              <label
                                htmlFor={`domain-period-${item.domain}`}
                                className={styles.vendorDomainCartPeriodLabel}
                              >
                                Period
                              </label>
                              <select
                                id={`domain-period-${item.domain}`}
                                className={styles.vendorDomainCartPeriodSelect}
                                value={item.period || DOMAIN_PERIOD_OPTIONS[0]}
                                onChange={(event) =>
                                  handlePeriodChange(item.domain, event.target.value)
                                }
                              >
                                {DOMAIN_PERIOD_OPTIONS.map((periodOption) => (
                                  <option key={periodOption} value={periodOption}>
                                    {periodOption}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <strong className={styles.vendorDomainCartEntryPrice}>
                              {item.pricingLoading
                                ? "Fetching price..."
                                : item.pricingError
                                  ? "Price unavailable"
                                  : Number.isFinite(item.numericPrice)
                                    ? `${formatCurrency(item.numericPrice, item.pricingCurrency)}/${item.pricingYears} yr`
                                    : "Price unavailable"}
                            </strong>
                          </div>

                          {item.pricingError && (
                            <p className={styles.vendorDomainCartPriceError}>
                              {item.pricingError?.message || item.pricingError?.error || item.pricingError}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={styles.vendorDomainCartModalFooter}>
                <div className={styles.vendorDomainCartTotalRow}>
                  <span className={styles.vendorDomainCartTotalLabel}>Total</span>
                  <strong className={styles.vendorDomainCartTotalValue}>
                    {isVisibleCheckoutReady ? formatCurrency(visibleCartTotal, checkoutCurrency) : "Waiting for pricing"}
                  </strong>
                </div>

                {!isVisibleCheckoutReady && visibleCartCount > 0 && (
                  <p className={styles.vendorDomainCartCheckoutHint}>
                    Checkout stays disabled until pricing is fetched for every selected domain.
                  </p>
                )}

                <Button
                  type="button"
                  variant="blueButton"
                  size="lg"
                  className={styles.vendorDomainCheckoutButton}
                  disabled={!isVisibleCheckoutReady}
                  onClick={handleOpenCheckout}
                >
                  Checkout
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  if (showDomainSearch && showPaymentSuccess) {
    return (
      <div className={styles.vendorDomainBrowsePage}>
        <div className={styles.vendorDomainBrowseTopbar}>
          <Button
            type="button"
            unstyled
            className={styles.vendorDomainBackButton}
            onClick={handleViewMyDomains}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to My Domains</span>
          </Button>

          <Button
            type="button"
            variant="blueButton"
            size="md"
            className={styles.vendorDomainCartButton}
            onClick={() => setShowCart(true)}
          >
              <span className={styles.vendorDomainCartIconWrap}>
                <FontAwesomeIcon icon={faCartShopping} />
              <span className={styles.vendorDomainCartBadge}>{visibleCartCount}</span>
            </span>
            <span>Cart</span>
          </Button>
        </div>

        <div className={styles.vendorDomainBrowseHeader}>
          <h5 className={styles.vendorDomainBrowseTitle}>Browse Domain</h5>
        </div>

        <section className={styles.vendorDomainSuccessWrap}>
          <div className={styles.vendorDomainSuccessCard}>
            <div className={styles.vendorDomainSuccessIcon} aria-hidden="true">
              <svg viewBox="0 0 72 72" width="72" height="72" fill="none" stroke="currentColor">
                <circle cx="36" cy="36" r="24" strokeWidth="4" />
                <path
                  d="M25 36l8 8 15-18"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h2 className={styles.vendorDomainSuccessTitle}>Domain Registered Successfully</h2>
            <p className={styles.vendorDomainSuccessText}>
              You now have successfully registered your domain
            </p>

            <p className={styles.vendorDomainSuccessDomain}>
              {paymentSuccessDetails?.domain || "yourdomain.com"}
            </p>

            <div className={styles.vendorDomainSuccessNext}>
              <h3 className={styles.vendorDomainSuccessNextTitle}>What&apos;s Next:</h3>
              <ol className={styles.vendorDomainSuccessList}>
                <li>Domain registered and active</li>
                <li>Link your domain to a store</li>
                <li>Manage DNS records</li>
              </ol>
            </div>

            <Button
              type="button"
              variant="blueButton"
              size="lg"
              className={styles.vendorDomainSuccessPrimaryButton}
              onClick={handleViewMyDomains}
            >
              View My Domains
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              className={styles.vendorDomainSuccessSecondaryButton}
              onClick={handleRegisterAnotherDomain}
            >
              Register Another Domain
            </Button>
          </div>
        </section>

        {cartModal}
      </div>
    );
  }

  if (showDomainSearch && showCheckout && showReviewDetails) {
    return (
      <div className={styles.vendorDomainBrowsePage}>
        <div className={styles.vendorDomainBrowseTopbar}>
          <Button
            type="button"
            unstyled
            className={styles.vendorDomainBackButton}
            onClick={() => setShowReviewDetails(false)}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to My Domains</span>
          </Button>

          <Button
            type="button"
            variant="blueButton"
            size="md"
            className={styles.vendorDomainCartButton}
            onClick={() => setShowCart(true)}
          >
            <span className={styles.vendorDomainCartIconWrap}>
              <FontAwesomeIcon icon={faCartShopping} />
              <span className={styles.vendorDomainCartBadge}>{visibleCartCount}</span>
            </span>
            <span>Cart</span>
          </Button>
        </div>

        <div className={styles.vendorDomainBrowseHeader}>
          <h5 className={styles.vendorDomainBrowseTitle}>Browse Domain</h5>
        </div>

        <section className={styles.vendorDomainCheckoutSection}>
          <h2 className={styles.vendorDomainCheckoutHeading}>Review Details</h2>

          <div className={styles.vendorDomainCheckoutLayout}>
            <div className={styles.vendorDomainCheckoutMain}>
              <section className={styles.vendorDomainCheckoutCard}>
                <div className={styles.vendorDomainCheckoutSectionHeader}>
                  <h3 className={styles.vendorDomainCheckoutSectionTitle}>Link Domain</h3>
                </div>

                <div className={styles.vendorDomainReviewRows}>
                  {cartPricingDetails.map((item) => (
                    <div key={`review-domain-${item.domain}`} className={styles.vendorDomainReviewGroup}>
                      <div className={styles.vendorDomainReviewRow}>
                        <span className={styles.vendorDomainReviewLabel}>Domain Name:</span>
                        <strong className={styles.vendorDomainReviewValue}>{item.domain}</strong>
                      </div>
                      <div className={styles.vendorDomainReviewRow}>
                        <span className={styles.vendorDomainReviewLabel}>Period:</span>
                        <span className={styles.vendorDomainReviewValue}>{item.period}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.vendorDomainCheckoutCard}>
                <div className={styles.vendorDomainCheckoutSectionHeader}>
                  <h3 className={styles.vendorDomainCheckoutSectionTitle}>Basic Information</h3>
                </div>

                <div className={styles.vendorDomainReviewRows}>
                  <div className={styles.vendorDomainReviewRow}>
                    <span className={styles.vendorDomainReviewLabel}>First Name:</span>
                    <span className={styles.vendorDomainReviewValue}>{checkoutForm.firstName || "-"}</span>
                  </div>
                  <div className={styles.vendorDomainReviewRow}>
                    <span className={styles.vendorDomainReviewLabel}>Last Name:</span>
                    <span className={styles.vendorDomainReviewValue}>{checkoutForm.lastName || "-"}</span>
                  </div>
                  <div className={styles.vendorDomainReviewRow}>
                    <span className={styles.vendorDomainReviewLabel}>Email:</span>
                    <span className={styles.vendorDomainReviewValue}>{checkoutForm.email || "-"}</span>
                  </div>
                  <div className={styles.vendorDomainReviewRow}>
                    <span className={styles.vendorDomainReviewLabel}>Phone Number:</span>
                    <span className={styles.vendorDomainReviewValue}>{checkoutForm.phoneNumber || "-"}</span>
                  </div>
                  <div className={styles.vendorDomainReviewRow}>
                    <span className={styles.vendorDomainReviewLabel}>Address:</span>
                    <span className={styles.vendorDomainReviewValue}>{checkoutForm.address1 || "-"}</span>
                  </div>
                  <div className={styles.vendorDomainReviewRow}>
                    <span className={styles.vendorDomainReviewLabel}>City:</span>
                    <span className={styles.vendorDomainReviewValue}>{checkoutForm.city || "-"}</span>
                  </div>
                  <div className={styles.vendorDomainReviewRow}>
                    <span className={styles.vendorDomainReviewLabel}>State/Province:</span>
                    <span className={styles.vendorDomainReviewValue}>{checkoutForm.state || "-"}</span>
                  </div>
                  <div className={styles.vendorDomainReviewRow}>
                    <span className={styles.vendorDomainReviewLabel}>Postal Code:</span>
                    <span className={styles.vendorDomainReviewValue}>{checkoutForm.postalCode || "-"}</span>
                  </div>
                </div>
              </section>

              {/* <section className={styles.vendorDomainCheckoutCard}>
                <div className={styles.vendorDomainCheckoutSectionHeader}>
                  <h3 className={styles.vendorDomainCheckoutSectionTitle}>Link Domain</h3>
                </div>

                <label className={styles.vendorDomainCheckoutCheckboxRow}>
                  <input type="checkbox" checked={checkoutForm.linkToStore} readOnly />
                  <span>Link to online store</span>
                </label>
              </section> */}

              <div className={styles.vendorDomainCheckoutFooter}>
                <Button
                  type="button"
                  variant="blueButton"
                  size="lg"
                  className={styles.vendorDomainCheckoutSubmitButton}
                  disabled={!isCheckoutReady || paymentLoading}
                  onClick={handleProceedToPayment}
                >
                  {paymentLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm text-light" role="status" aria-hidden="true" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Proceed to Payment</span>
                  )}
                </Button>
              </div>
            </div>

            <aside className={styles.vendorDomainCheckoutSidebar}>
              <div className={styles.vendorDomainCheckoutSummaryCard}>
                <div className={styles.vendorDomainCheckoutSectionHeader}>
                  <h3 className={styles.vendorDomainCheckoutSectionTitle}>Order Summary</h3>
                </div>

                <div className={styles.vendorDomainCheckoutSummaryList}>
                  {cartPricingDetails.map((item) => (
                    <div key={`review-summary-${item.domain}`} className={styles.vendorDomainCheckoutSummaryItem}>
                      <span className={styles.vendorDomainCheckoutSummaryName}>{item.domain}</span>
                      <strong className={styles.vendorDomainCheckoutSummaryAmount}>
                        {Number.isFinite(item.numericPrice)
                          ? `${formatCurrency(item.numericPrice, item.pricingCurrency)}/${item.pricingYears} yr`
                          : "Fetching price..."}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className={styles.vendorDomainCheckoutTotalsBox}>
                  <div className={styles.vendorDomainCheckoutTotalsRow}>
                    <span>Subtotal</span>
                    <span>{isCheckoutReady ? formatCurrency(cartTotal, checkoutCurrency) : "Waiting for pricing"}</span>
                  </div>
                  <div className={styles.vendorDomainCheckoutTotalsRow}>
                    <strong>Total</strong>
                    <strong className={styles.vendorDomainCheckoutSummaryTotal}>
                      {isCheckoutReady ? formatCurrency(cartTotal, checkoutCurrency) : "Waiting for pricing"}
                    </strong>
                  </div>
                </div>

                <p className={styles.vendorDomainCheckoutSummaryNote}>
                  Automatic renewal at regular price after 1 year
                </p>
              </div>
            </aside>
          </div>
        </section>

        {cartModal}
      </div>
    );
  }

  if (showDomainSearch && showCheckout) {
    return (
      <div className={styles.vendorDomainBrowsePage}>
        <div className={styles.vendorDomainBrowseTopbar}>
          <Button
            type="button"
            unstyled
            className={styles.vendorDomainBackButton}
            onClick={() => setShowCheckout(false)}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to My Domains</span>
          </Button>

          <Button
            type="button"
            variant="blueButton"
            size="md"
            className={styles.vendorDomainCartButton}
            onClick={() => setShowCart(true)}
          >
            <span className={styles.vendorDomainCartIconWrap}>
              <FontAwesomeIcon icon={faCartShopping} />
              <span className={styles.vendorDomainCartBadge}>{visibleCartCount}</span>
            </span>
            <span>Cart</span>
          </Button>
        </div>

        <div className={styles.vendorDomainBrowseHeader}>
          <h5 className={styles.vendorDomainBrowseTitle}>Browse Domain</h5>
        </div>

        <section className={styles.vendorDomainCheckoutSection}>
          <h2 className={styles.vendorDomainCheckoutHeading}>Checkout Registration Details</h2>

          <div className={styles.vendorDomainCheckoutLayout}>
            <div className={styles.vendorDomainCheckoutMain}>
              {cartPricingDetails.map((item) => (
                <article key={item.domain} className={styles.vendorDomainCheckoutCard}>
                  <div className={styles.vendorDomainCheckoutCardHeader}>
                    <div>
                      <h3 className={styles.vendorDomainCheckoutDomainTitle}>{item.domain}</h3>
                      <span className={styles.vendorDomainCartEntryBadge}>
                        {resolveRegistrationLabel(item.domain)}
                      </span>
                    </div>

                    <div className={styles.vendorDomainCheckoutCardMeta}>
                      <span className={styles.vendorDomainCartSaveBadge}>Save 30%</span>
                      <strong className={styles.vendorDomainCheckoutDomainPrice}>
                        {Number.isFinite(item.numericPrice)
                          ? `${formatCurrency(item.numericPrice, item.pricingCurrency)}/${item.pricingYears} yr`
                          : "Fetching price..."}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.vendorDomainCheckoutFieldGroup}>
                    <label
                      htmlFor={`checkout-domain-period-${item.domain}`}
                      className={styles.vendorDomainCartPeriodLabel}
                    >
                      Period
                    </label>
                    <select
                      id={`checkout-domain-period-${item.domain}`}
                      className={styles.vendorDomainCartPeriodSelect}
                      value={item.period || DOMAIN_PERIOD_OPTIONS[0]}
                      onChange={(event) => handlePeriodChange(item.domain, event.target.value)}
                    >
                      {DOMAIN_PERIOD_OPTIONS.map((periodOption) => (
                        <option key={periodOption} value={periodOption}>
                          {periodOption}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.vendorDomainCheckoutNotice}>
                    {item.pricingNote ||
                      (Number.isFinite(item.pricingPerYear)
                        ? `Renews at ${formatCurrency(item.pricingPerYear, item.pricingCurrency)}/year. Cancel anytime`
                        : "Pricing details will appear once the domain price is fetched.")}
                  </div>
                </article>
              ))}

              <section className={styles.vendorDomainCheckoutCard}>
                <div className={styles.vendorDomainCheckoutSectionHeader}>
                  <h3 className={styles.vendorDomainCheckoutSectionTitle}>Basic Information</h3>
                </div>

                <div className={styles.vendorDomainCheckoutFormGrid}>
                  <div className={styles.vendorDomainCheckoutInputGroup}>
                    <label htmlFor="domain-first-name">First Name</label>
                    <input
                      id="domain-first-name"
                      type="text"
                      placeholder="Enter first name"
                      className={styles.vendorDomainCheckoutInput}
                      value={checkoutForm.firstName}
                      onChange={(event) => handleCheckoutFieldChange("firstName", event.target.value)}
                    />
                  </div>

                  <div className={styles.vendorDomainCheckoutInputGroup}>
                    <label htmlFor="domain-last-name">Last Name</label>
                    <input
                      id="domain-last-name"
                      type="text"
                      placeholder="Enter last name"
                      className={styles.vendorDomainCheckoutInput}
                      value={checkoutForm.lastName}
                      onChange={(event) => handleCheckoutFieldChange("lastName", event.target.value)}
                    />
                  </div>

                  <div className={styles.vendorDomainCheckoutInputGroup}>
                    <label htmlFor="domain-email">Email</label>
                    <input
                      id="domain-email"
                      type="email"
                      placeholder="example@email.com"
                      className={styles.vendorDomainCheckoutInput}
                      value={checkoutForm.email}
                      onChange={(event) => handleCheckoutFieldChange("email", event.target.value)}
                    />
                  </div>

                  <div className={styles.vendorDomainCheckoutInputGroup}>
                    <label htmlFor="domain-phone">Phone Number</label>
                    <input
                      id="domain-phone"
                      type="text"
                      placeholder="+234"
                      className={styles.vendorDomainCheckoutInput}
                      value={checkoutForm.phoneNumber}
                      onChange={(event) => handleCheckoutFieldChange("phoneNumber", event.target.value)}
                    />
                  </div>

                  <div className={styles.vendorDomainCheckoutInputGroup}>
                    <label htmlFor="domain-address-one">Address 1</label>
                    <input
                      id="domain-address-one"
                      type="text"
                      placeholder="Enter address"
                      className={styles.vendorDomainCheckoutInput}
                      value={checkoutForm.address1}
                      onChange={(event) => handleCheckoutFieldChange("address1", event.target.value)}
                    />
                  </div>

                  <div className={styles.vendorDomainCheckoutInputGroup}>
                    <label htmlFor="domain-city">City</label>
                    <input
                      id="domain-city"
                      type="text"
                      placeholder="City"
                      className={styles.vendorDomainCheckoutInput}
                      value={checkoutForm.city}
                      onChange={(event) => handleCheckoutFieldChange("city", event.target.value)}
                    />
                  </div>

                  <div className={styles.vendorDomainCheckoutInputGroup}>
                    <label htmlFor="domain-state">State/Province</label>
                    <select
                      id="domain-state"
                      className={styles.vendorDomainCheckoutInput}
                      value={checkoutForm.state}
                      onChange={(event) => handleCheckoutFieldChange("state", event.target.value)}
                    >
                      <option value="">Select state</option>
                      <option value="Lagos">Lagos</option>
                      <option value="Abuja">Abuja</option>
                      <option value="Rivers">Rivers</option>
                    </select>
                  </div>

                  <div className={styles.vendorDomainCheckoutInputGroup}>
                    <label htmlFor="domain-postal-code">Postal Code</label>
                    <input
                      id="domain-postal-code"
                      type="text"
                      placeholder="1000001"
                      className={styles.vendorDomainCheckoutInput}
                      value={checkoutForm.postalCode}
                      onChange={(event) => handleCheckoutFieldChange("postalCode", event.target.value)}
                    />
                  </div>

                </div>
              </section>

              <section className={styles.vendorDomainCheckoutCard}>
                <div className={styles.vendorDomainCheckoutSectionHeader}>
                  <h3 className={styles.vendorDomainCheckoutSectionTitle}>Link Domain</h3>
                </div>

                {/* <label className={styles.vendorDomainCheckoutCheckboxRow}>
                  <input
                    type="checkbox"
                    checked={checkoutForm.linkToStore}
                    onChange={(event) =>
                      handleCheckoutFieldChange("linkToStore", event.target.checked)
                    }
                  />
                  <span>Link to online store</span>
                </label> */}

                <div className={styles.vendorDomainCheckoutInfoBox}>
                  <FontAwesomeIcon icon={faCircleInfo} />
                  <p>
                    Linking your domain to a store will automatically configure DNS records and provision SSL certificates
                  </p>
                </div>
              </section>

              <div className={styles.vendorDomainCheckoutFooter}>
                <Button
                  type="button"
                  variant="blueButton"
                  size="lg"
                  className={styles.vendorDomainCheckoutSubmitButton}
                  disabled={!isCheckoutReady}
                  onClick={handleOpenReviewDetails}
                >
                  Checkout
                </Button>
              </div>
            </div>

            <aside className={styles.vendorDomainCheckoutSidebar}>
              <div className={styles.vendorDomainCheckoutSummaryCard}>
                <div className={styles.vendorDomainCheckoutSectionHeader}>
                  <h3 className={styles.vendorDomainCheckoutSectionTitle}>Order Summary</h3>
                </div>

                <div className={styles.vendorDomainCheckoutSummaryList}>
                  {cartPricingDetails.map((item) => (
                    <div key={`summary-${item.domain}`} className={styles.vendorDomainCheckoutSummaryItem}>
                      <span className={styles.vendorDomainCheckoutSummaryName}>{item.domain}</span>
                      <strong className={styles.vendorDomainCheckoutSummaryAmount}>
                        {Number.isFinite(item.numericPrice)
                          ? `${formatCurrency(item.numericPrice, item.pricingCurrency)}/${item.pricingYears} yr`
                          : "Fetching price..."}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className={styles.vendorDomainCheckoutTotalsBox}>
                  <div className={styles.vendorDomainCheckoutTotalsRow}>
                    <span>Subtotal</span>
                    <span>{isCheckoutReady ? formatCurrency(cartTotal, checkoutCurrency) : "Waiting for pricing"}</span>
                  </div>
                  <div className={styles.vendorDomainCheckoutTotalsRow}>
                    <strong>Total</strong>
                    <strong className={styles.vendorDomainCheckoutSummaryTotal}>
                      {isCheckoutReady ? formatCurrency(cartTotal, checkoutCurrency) : "Waiting for pricing"}
                    </strong>
                  </div>
                </div>

                <p className={styles.vendorDomainCheckoutSummaryNote}>
                  Automatic renewal at regular price after 1 year
                </p>
              </div>
            </aside>
          </div>
        </section>

        {cartModal}
      </div>
    );
  }

  if (showDomainSearch) {
    return (
      <div className={styles.vendorDomainBrowsePage}>
        <div className={styles.vendorDomainBrowseTopbar}>
          <Button
            type="button"
            unstyled
            className={styles.vendorDomainBackButton}
            onClick={() => setShowDomainSearch(false)}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to My Domains</span>
          </Button>

          <Button
            type="button"
            variant="blueButton"
            size="md"
            className={styles.vendorDomainCartButton}
            onClick={() => setShowCart(true)}
          >
            <span className={styles.vendorDomainCartIconWrap}>
              <FontAwesomeIcon icon={faCartShopping} />
              <span className={styles.vendorDomainCartBadge}>{visibleCartCount}</span>
            </span>
            <span>Cart</span>
          </Button>
        </div>

        <div className={styles.vendorDomainBrowseHeader}>
          <h5 className={styles.vendorDomainBrowseTitle}>Browse Domain</h5>
        </div>

        <section className={styles.vendorDomainSearchHero}>
          <div className={styles.vendorDomainSearchHeroCopy}>
            <h4 className={`nx ${styles.vendorDomainSearchTitle}`}>
              Register Your Domain
            </h4>
            <p className={styles.vendorDomainSearchSubtitle}>
              Find and register the perfect domain for your online store
            </p>
          </div>

          <article className={styles.vendorDomainSearchCard}>
            <div className={styles.vendorDomainSearchCardHeader}>
              <h3>Find Your Perfect Domain</h3>
              <p>
                Search for your domain name and choose from available extensions
              </p>
            </div>

            <div className={styles.vendorDomainSearchRow}>
              <input
                type="text"
                placeholder="Enter domain name e.g., mystore"
                className={styles.vendorDomainSearchInput}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleDomainSearch();
                  }
                }}
              />

              <Button
                type="button"
                variant="blueButton"
                size="md"
                className={styles.vendorDomainSearchButton}
                onClick={handleDomainSearch}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                <span>{loading ? "Searching..." : "Search"}</span>
              </Button>
            </div>

            {error && (
              <p className={styles.vendorDomainEmptyText}>
                {error?.message || error?.error || error || "Unable to check this domain right now."}
              </p>
            )}

            {!loading && activeDomainQuery && !error && domainResults.length === 0 && success && (
              <p className={styles.vendorDomainEmptyText}>
                No domain result was returned for "{activeDomainQuery}".
              </p>
            )}

            {!loading && domainResults.length > 0 && (
              <div className={styles.vendorDomainResultsList}>
                {domainResults.map((domainResult, index) => {
                  const domainName = resolveDomainName(domainResult) || activeDomainQuery;
                  const isAvailable = resolveAvailability(domainResult);
                  const price = resolvePrice(domainResult);
                  const suggestions = resolveSuggestions(domainResult);
                  const domainInCart = isDomainInCart(domainName);

                  return (
                    <article key={`${domainName}-${index}`} className={styles.vendorDomainResultCard}>
                      <div
                        className={`${styles.vendorDomainStatusBanner} ${
                          isAvailable
                            ? styles.vendorDomainStatusBannerSuccess
                            : styles.vendorDomainStatusBannerTaken
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={isAvailable ? faCircleCheck : faCircleInfo}
                          className={styles.vendorDomainStatusIcon}
                        />
                        <p className={styles.vendorDomainStatusText}>
                          <strong>{domainName}</strong>{" "}
                          {isAvailable
                            ? "is available. Add it to your cart below."
                            : "is already taken. Explore similar options below."}
                        </p>
                      </div>

                      <div className={styles.vendorDomainResultBody}>
                        <div className={styles.vendorDomainResultMeta}>
                          <h3 className={styles.vendorDomainResultTitle}>{domainName}</h3>
                          <p className={styles.vendorDomainResultSubtitle}>
                            {isAvailable
                              ? "Ready for registration"
                              : "Unavailable for registration"}
                          </p>
                        </div>

                        {price && (
                          <div className={styles.vendorDomainPriceBlock}>
                            <span className={styles.vendorDomainPriceLabel}>Price</span>
                            <strong className={styles.vendorDomainPriceValue}>{price}</strong>
                          </div>
                        )}

                        {isAvailable && (
                          <Button
                            type="button"
                            variant="blueButton"
                            size="md"
                            className={styles.vendorDomainAddCartButton}
                            onClick={() => handleAddToCart(domainResult)}
                            disabled={domainInCart}
                          >
                            <FontAwesomeIcon icon={faCartShopping} />
                            <span>{domainInCart ? "Added to cart" : "Add to cart"}</span>
                          </Button>
                        )}
                      </div>

                      {!isAvailable && suggestions.length > 0 && (
                        <div className={styles.vendorDomainSuggestions}>
                          {suggestions.map((suggestion, suggestionIndex) => (
                            <span
                              key={`${domainName}-suggestion-${suggestionIndex}`}
                              className={styles.vendorDomainSuggestionChip}
                            >
                              {typeof suggestion === "string"
                                ? suggestion
                                : resolveDomainName(suggestion) || `Option ${suggestionIndex + 1}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

          </article>
        </section>

        {cartModal}
      </div>
    );
  }

  return (
    <div className={styles.vendorDomainPage}>
      <header className={styles.vendorDomainHeader}>
        <div>
          <h5 className={styles.vendorDomainTitle}>Manage Your Domain</h5>
          <p className={styles.vendorDomainSubtitle}>
            Browse and link domain to your store
          </p>
        </div>

        <Button
          type="button"
          variant="blueButton"
          size="lg"
          className={styles.vendorDomainHeaderButton}
          onClick={() => setShowDomainSearch(true)}
        >
          New Domains
        </Button>
      </header>

      <section className={styles.vendorDomainSection}>
        <div className={styles.vendorDomainSectionHeader}>
          <small className={styles.vendorDomainSectionTitle}>My Domains</small>
          <span className={styles.vendorDomainCount}>(1)</span>
        </div>

        <div className={styles.vendorDomainDivider} />

        <article className={styles.vendorDomainCard}>
          <div className={styles.vendorDomainCardInner}>
            <div className={styles.vendorDomainIconWrap} aria-hidden="true">
              <FontAwesomeIcon icon={faGlobe} />
            </div>

            <h3 className={styles.vendorDomainEmptyTitle}>
              No active domain available
            </h3>
            <p className={styles.vendorDomainEmptyText}>
              Expand your business by linking your store to your domain
            </p>

            <Button
              type="button"
              unstyled
              className={styles.vendorDomainCta}
              onClick={() => setShowDomainSearch(true)}
            >
              Get a Domain
            </Button>
          </div>
        </article>
      </section>
    </div>
  );
};

export default Domain;
