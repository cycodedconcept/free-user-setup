import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDispatch, useSelector } from 'react-redux';
import { getDomainPrice, getDomains, resetStatus, payForDomain, getAllDomains, linkStore, unLinkStore, getDnsRecord, updateDnsRecord, addSsl, getSSLDomain } from "../../../slice/domainSlice";
import Swal from "sweetalert2";
import {
  faArrowLeft,
  faCartShopping,
  faCircleCheck,
  faCircleInfo,
  faEllipsisVertical,
  faEye,
  faGear,
  faGlobe,
  faLink,
  faMagnifyingGlass,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../../components/ui/Button";
import Pagination from "../../../components/Pagination";
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

const readStoredManagedDomains = () => {
  if (typeof window === "undefined") return [];

  try {
    const rawDomains = localStorage.getItem("dom");
    if (!rawDomains) return [];

    const parsedDomains = JSON.parse(rawDomains);
    return Array.isArray(parsedDomains) ? parsedDomains : [];
  } catch {
    return [];
  }
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

const resolveManagedDomainName = (domainItem) =>
  domainItem?.domain_name || domainItem?.domain || domainItem?.name || "";

const resolveManagedDomainId = (domainItem) =>
  domainItem?.id || domainItem?.domain_id || domainItem?.domainId || null;

const formatManagedDomainDate = (dateValue) => {
  if (!dateValue) return "N/A";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const resolveLinkedStoreCount = (domainItem) =>
  domainItem?.OnlineStore || domainItem?.online_store_id ? 1 : 0;

const resolveLinkedStoreId = (domainItem) =>
  domainItem?.online_store_id || domainItem?.OnlineStore?.id || null;

const resolveLinkedStoreName = (domainItem) =>
  domainItem?.OnlineStore?.store_name ||
  domainItem?.OnlineStore?.name ||
  domainItem?.OnlineStore?.business_name ||
  null;

const normalizeDnsFormRecords = (records) =>
  (Array.isArray(records) ? records : []).map((record) => ({
    hostId: record?.hostId?.toString?.() || "",
    name: record?.name?.toString?.() || "",
    type: record?.type?.toString?.() || "",
    address: record?.address?.toString?.() || "",
    mxPref: record?.mxPref?.toString?.() || "",
    ttl: record?.ttl?.toString?.() || "",
  }));

const formatDomainStatusLabel = (status) => {
  if (!status) return "Pending";
  return status
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const resolveDomainStatusClassName = (status) => {
  const normalizedStatus = status?.toString?.().toLowerCase?.() || "";

  if (normalizedStatus === "active") {
    return styles.vendorDomainListStatusBadgeActive;
  }

  if (normalizedStatus === "pending") {
    return styles.vendorDomainListStatusBadgePending;
  }

  return "";
};

const Domain = () => {
  const pageRef = useRef(null);
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const onlineStoreId = localStorage.getItem("itemId") || '7';
  const initialPaymentSuccess = readPendingDomainPayment();
  const [showDomainSearch, setShowDomainSearch] = useState(Boolean(initialPaymentSuccess));
  const [searchInput, setSearchInput] = useState("");
  const [activeDomainQuery, setActiveDomainQuery] = useState("");
  const [searchCounter, setSearchCounter] = useState(0);
  const [cartItems, setCartItems] = useState(() =>
    initialPaymentSuccess ? [] : readDomainCart()
  );
  const [showCart, setShowCart] = useState(false);
  const [showDnsModal, setShowDnsModal] = useState(false);
  const [showDnsUpdateModal, setShowDnsUpdateModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReviewDetails, setShowReviewDetails] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(Boolean(initialPaymentSuccess));
  const [paymentSuccessDetails, setPaymentSuccessDetails] = useState(initialPaymentSuccess);
  const [checkoutForm, setCheckoutForm] = useState(initialCheckoutForm);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDomainActionId, setActiveDomainActionId] = useState(null);
  const [linkingDomainId, setLinkingDomainId] = useState(null);
  const [unlinkingDomainId, setUnlinkingDomainId] = useState(null);
  const [dnsLoadingDomainId, setDnsLoadingDomainId] = useState(null);
  const [sslLoadingDomainId, setSslLoadingDomainId] = useState(null);
  const [activatingSslDomainId, setActivatingSslDomainId] = useState(null);
  const [dnsModalData, setDnsModalData] = useState(null);
  const [dnsModalDomainId, setDnsModalDomainId] = useState(null);
  const [dnsFormRecords, setDnsFormRecords] = useState([]);
  const [isSubmittingDnsUpdate, setIsSubmittingDnsUpdate] = useState(false);
  const [paginationViewportStyle, setPaginationViewportStyle] = useState({});
  const [storedManagedDomains, setStoredManagedDomains] = useState(() =>
    readStoredManagedDomains()
  );
  const myStore = useSelector((state) => state.store?.myStore);
  const {
    success,
    error,
    loading,
    myDomain,
    domainPricing,
    pricingStatus,
    paymentLoading,
    allDomains
  } = useSelector((state) => state.domain);
  const domainResults = normalizeDomainResults(myDomain);
  const managedDomains =
    Array.isArray(allDomains?.data) && allDomains.data.length > 0
      ? allDomains.data
      : storedManagedDomains;
  const managedDomainsPagination = allDomains?.pagination || {};
  const totalManagedDomains =
    allDomains?.total ||
    managedDomainsPagination?.totalItems ||
    storedManagedDomains.length ||
    0;
  const hasManagedDomains = managedDomains.length > 0;

  useEffect(() => {
    if (token && !showDomainSearch) {
      dispatch(getAllDomains({ token, page: currentPage, limit: 20 }));
    }
  }, [currentPage, dispatch, showDomainSearch, token]);

  useEffect(() => {
    if (!hasManagedDomains || showDomainSearch || typeof window === "undefined") {
      setPaginationViewportStyle({});
      return undefined;
    }

    const updatePaginationViewportStyle = () => {
      const pageElement = pageRef.current;
      if (!pageElement) return;

      const rect = pageElement.getBoundingClientRect();
      setPaginationViewportStyle({
        left: `${Math.max(0, rect.left)}px`,
        right: `${Math.max(0, window.innerWidth - rect.right)}px`,
        bottom: "0px",
      });
    };

    updatePaginationViewportStyle();
    window.addEventListener("resize", updatePaginationViewportStyle);

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined" && pageRef.current) {
      resizeObserver = new ResizeObserver(updatePaginationViewportStyle);
      resizeObserver.observe(pageRef.current);
    }

    return () => {
      window.removeEventListener("resize", updatePaginationViewportStyle);
      resizeObserver?.disconnect();
    };
  }, [hasManagedDomains, showDomainSearch]);

  useEffect(() => {
    if (token && activeDomainQuery && searchCounter > 0) {
      dispatch(getDomains({ token, domain: activeDomainQuery }));
    }
  }, [activeDomainQuery, searchCounter, token, dispatch]);

  useEffect(() => {
    setStoredManagedDomains(readStoredManagedDomains());
  }, [allDomains]);

  useEffect(() => {
    return () => {
      dispatch(resetStatus());
    };
  }, [dispatch]);

  useEffect(() => {
    if ((!showCart && !showDnsModal && !showDnsUpdateModal) || typeof document === "undefined") {
      return undefined;
    }

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflow;
    };
  }, [showCart, showDnsModal, showDnsUpdateModal]);

  useEffect(() => {
    if (!activeDomainActionId || typeof document === "undefined") return undefined;

    const handlePointerDown = (event) => {
      if (event.target.closest('[data-domain-action-menu="true"]')) {
        return;
      }

      setActiveDomainActionId(null);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveDomainActionId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeDomainActionId]);

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
    setCurrentPage(1);
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

  const handleDomainPageChange = (page) => {
    setCurrentPage(page);
  };

  const handleToggleStoreLink = async (domainItem) => {
    const domainId = resolveManagedDomainId(domainItem);
    const domainName = resolveManagedDomainName(domainItem) || "this domain";
    const linkedStoreId = resolveLinkedStoreId(domainItem);
    const linkedStoreName = resolveLinkedStoreName(domainItem);
    const currentStoreName =
      myStore?.onlineStore?.store_name || linkedStoreName || "your store";
    const targetStoreId = onlineStoreId;

    setActiveDomainActionId(null);

    if (!token) {
      await Swal.fire({
        icon: "error",
        title: "Authentication required",
        text: "Please log in again before linking a store.",
      });
      return;
    }

    if (!domainId) {
      await Swal.fire({
        icon: "error",
        title: "Domain not found",
        text: "This domain is missing its identifier.",
      });
      return;
    }

    if (!targetStoreId) {
      await Swal.fire({
        icon: "warning",
        title: "Store not found",
        text: "Set up or select an online store before linking a domain.",
      });
      return;
    }

    if (linkedStoreId) {
      await Swal.fire({
        icon: "info",
        title: "Store already linked",
        text: `${linkedStoreName || currentStoreName} is already linked to ${domainName}.`,
      });
      return;
    }

    setLinkingDomainId(domainId);

    Swal.fire({
      title: "Linking Store",
      text: `Linking ${currentStoreName} to ${domainName}.`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await dispatch(
        linkStore({
          token,
          domainId,
          online_store_id: targetStoreId,
        })
      ).unwrap();

      const refetchResponse = await dispatch(
        getAllDomains({ token, page: currentPage, limit: 20 })
      ).unwrap();
      Swal.close();

      const refreshedDomain =
        refetchResponse?.data?.domains?.find((item) => resolveManagedDomainId(item) === domainId) ||
        domainItem;
      const refreshedStoreName =
        resolveLinkedStoreName(refreshedDomain) ||
        myStore?.onlineStore?.store_name ||
        currentStoreName;

      await Swal.fire({
        icon: "success",
        title: "Store Linked",
        text: `${refreshedStoreName} has been linked to ${domainName}.`,
      });
    } catch (linkError) {
      Swal.close();
      await Swal.fire({
        icon: "error",
        title: "Unable to link store",
        text:
          linkError?.message ||
          linkError?.error ||
          linkError?.data?.message ||
          "Something went wrong while updating the domain link.",
      });
    } finally {
      setLinkingDomainId(null);
    }
  };

  const handleUnlinkStore = async (domainItem) => {
    const domainId = resolveManagedDomainId(domainItem);
    const domainName = resolveManagedDomainName(domainItem) || "this domain";
    const linkedStoreId = resolveLinkedStoreId(domainItem);
    const linkedStoreName =
      resolveLinkedStoreName(domainItem) || myStore?.onlineStore?.store_name || "The store";

    setActiveDomainActionId(null);

    if (!token) {
      await Swal.fire({
        icon: "error",
        title: "Authentication required",
        text: "Please log in again before unlinking a store.",
      });
      return;
    }

    if (!domainId) {
      await Swal.fire({
        icon: "error",
        title: "Domain not found",
        text: "This domain is missing its identifier.",
      });
      return;
    }

    if (!linkedStoreId) {
      await Swal.fire({
        icon: "info",
        title: "No linked store",
        text: `${domainName} is not linked to any store yet.`,
      });
      return;
    }

    setUnlinkingDomainId(domainId);

    Swal.fire({
      title: "Unlinking Store",
      text: `Unlinking ${linkedStoreName} from ${domainName}.`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await dispatch(
        unLinkStore({
          token,
          domainId,
        })
      ).unwrap();

      await dispatch(getAllDomains({ token, page: currentPage, limit: 20 })).unwrap();
      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "Store Unlinked",
        text: `${linkedStoreName} has been unlinked from ${domainName}.`,
      });
    } catch (unlinkError) {
      Swal.close();
      await Swal.fire({
        icon: "error",
        title: "Unable to unlink store",
        text:
          unlinkError?.message ||
          unlinkError?.error ||
          unlinkError?.data?.message ||
          "Something went wrong while unlinking the store.",
      });
    } finally {
      setUnlinkingDomainId(null);
    }
  };

  const handleManageDns = async (domainItem) => {
    const domainId = resolveManagedDomainId(domainItem);
    const domainName = resolveManagedDomainName(domainItem) || "this domain";

    setActiveDomainActionId(null);

    if (!token) {
      await Swal.fire({
        icon: "error",
        title: "Authentication required",
        text: "Please log in again before loading DNS records.",
      });
      return;
    }

    if (!domainId) {
      await Swal.fire({
        icon: "error",
        title: "Domain not found",
        text: "This domain is missing its identifier.",
      });
      return;
    }

    setDnsLoadingDomainId(domainId);

    Swal.fire({
      title: "Loading DNS Records",
      text: `Fetching DNS records for ${domainName}.`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const dnsResponse = await dispatch(
        getDnsRecord({
          token,
          domainId,
        })
      ).unwrap();

      Swal.close();
      setDnsModalDomainId(domainId);
      setDnsModalData(dnsResponse?.data || null);
      setDnsFormRecords(normalizeDnsFormRecords(dnsResponse?.data?.records));
      setShowDnsUpdateModal(false);
      setShowDnsModal(true);
    } catch (dnsError) {
      Swal.close();
      await Swal.fire({
        icon: "error",
        title: "Unable to load DNS records",
        text:
          dnsError?.message ||
          dnsError?.error ||
          dnsError?.data?.message ||
          "Something went wrong while loading DNS records.",
      });
    } finally {
      setDnsLoadingDomainId(null);
    }
  };

  const handleAddSsl = async (domainItem) => {
    const domainId = resolveManagedDomainId(domainItem);
    const domainName = resolveManagedDomainName(domainItem) || "this domain";

    setActiveDomainActionId(null);

    if (!token) {
      await Swal.fire({
        icon: "error",
        title: "Authentication required",
        text: "Please log in again before adding SSL.",
      });
      return;
    }

    if (!domainId) {
      await Swal.fire({
        icon: "error",
        title: "Domain not found",
        text: "This domain is missing its identifier.",
      });
      return;
    }

    if (domainItem?.ssl_enabled) {
      await Swal.fire({
        icon: "info",
        title: "SSL already active",
        text: `${domainName} already has SSL enabled.`,
      });
      return;
    }

    setSslLoadingDomainId(domainId);

    Swal.fire({
      title: "Adding SSL",
      text: `Provisioning SSL for ${domainName}.`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const sslResponse = await dispatch(
        addSsl({
          token,
          domainId,
        })
      ).unwrap();

      await dispatch(getAllDomains({ token, page: currentPage, limit: 20 })).unwrap();
      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "SSL Added",
        text:
          sslResponse?.message ||
          `SSL has been added to ${domainName}.`,
      });
    } catch (sslError) {
      Swal.close();
      await Swal.fire({
        icon: "error",
        title: "Unable to add SSL",
        text:
          sslError?.message ||
          sslError?.error ||
          sslError?.data?.message ||
          "Something went wrong while adding SSL to the domain.",
      });
    } finally {
      setSslLoadingDomainId(null);
    }
  };

  const handleActivateSsl = async (domainItem) => {
    const domainId = resolveManagedDomainId(domainItem);
    const domainName = resolveManagedDomainName(domainItem) || "this domain";

    setActiveDomainActionId(null);

    if (!token) {
      await Swal.fire({
        icon: "error",
        title: "Authentication required",
        text: "Please log in again before activating SSL.",
      });
      return;
    }

    if (!domainId) {
      await Swal.fire({
        icon: "error",
        title: "Domain not found",
        text: "This domain is missing its identifier.",
      });
      return;
    }

    setActivatingSslDomainId(domainId);

    Swal.fire({
      title: "Activating SSL",
      text: `Activating SSL for ${domainName}.`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const sslResponse = await dispatch(
        getSSLDomain({
          token,
          domainId,
        })
      ).unwrap();

      await dispatch(getAllDomains({ token, page: currentPage, limit: 20 })).unwrap();
      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "SSL Activated",
        text:
          sslResponse?.message ||
          `SSL activation was triggered for ${domainName}.`,
      });
    } catch (sslError) {
      Swal.close();
      await Swal.fire({
        icon: "error",
        title: "Unable to activate SSL",
        text:
          sslError?.message ||
          sslError?.error ||
          sslError?.data?.message ||
          "Something went wrong while activating SSL for the domain.",
      });
    } finally {
      setActivatingSslDomainId(null);
    }
  };

  const handleOpenDnsUpdateModal = () => {
    setDnsFormRecords(normalizeDnsFormRecords(dnsModalData?.records));
    setShowDnsUpdateModal(true);
  };

  const handleDnsRecordFieldChange = (index, field, value) => {
    setDnsFormRecords((currentRecords) =>
      currentRecords.map((record, recordIndex) =>
        recordIndex === index ? { ...record, [field]: value } : record
      )
    );
  };

  const handleSubmitDnsUpdate = async () => {
    if (!token) {
      await Swal.fire({
        icon: "error",
        title: "Authentication required",
        text: "Please log in again before updating DNS records.",
      });
      return;
    }

    if (!dnsModalDomainId) {
      await Swal.fire({
        icon: "error",
        title: "Domain not found",
        text: "The active DNS domain could not be resolved.",
      });
      return;
    }

    const sanitizedRecords = dnsFormRecords.map((record) => ({
      hostId: record.hostId.trim(),
      name: record.name.trim(),
      type: record.type.trim(),
      address: record.address.trim(),
      mxPref: record.mxPref.trim(),
      ttl: record.ttl.trim(),
    }));

    const invalidRecord = sanitizedRecords.find(
      (record) => !record.hostId || !record.name || !record.type || !record.address || !record.ttl
    );

    if (invalidRecord) {
      await Swal.fire({
        icon: "warning",
        title: "Incomplete DNS record",
        text: "Host ID, Name, Type, Address, and TTL are required for every record.",
      });
      return;
    }

    setIsSubmittingDnsUpdate(true);

    try {
      await dispatch(
        updateDnsRecord({
          token,
          domainId: dnsModalDomainId,
          records: sanitizedRecords,
        })
      ).unwrap();

      const refreshedDnsResponse = await dispatch(
        getDnsRecord({
          token,
          domainId: dnsModalDomainId,
        })
      ).unwrap();

      setDnsModalData(refreshedDnsResponse?.data || null);
      setDnsFormRecords(normalizeDnsFormRecords(refreshedDnsResponse?.data?.records));
      setShowDnsUpdateModal(false);

      await Swal.fire({
        icon: "success",
        title: "DNS Updated",
        text: `DNS records for ${refreshedDnsResponse?.data?.domain || "this domain"} were updated successfully.`,
      });
    } catch (updateError) {
      await Swal.fire({
        icon: "error",
        title: "Unable to update DNS",
        text:
          updateError?.message ||
          updateError?.error ||
          updateError?.data?.message ||
          "Something went wrong while updating DNS records.",
      });
    } finally {
      setIsSubmittingDnsUpdate(false);
    }
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

  const dnsRecords = Array.isArray(dnsModalData?.records) ? dnsModalData.records : [];

  const dnsModal =
    showDnsModal && typeof document !== "undefined"
      ? createPortal(
          <div
            className={styles.vendorDomainCartOverlay}
            onClick={() => {
              setShowDnsModal(false);
              setShowDnsUpdateModal(false);
            }}
          >
            <div
              className={styles.vendorDomainDnsModal}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.vendorDomainCartModalHeader}>
                <div>
                  <h3 className={styles.vendorDomainCartModalTitle}>Manage DNS</h3>
                  <p className={styles.vendorDomainDnsModalSubtitle}>
                    {dnsModalData?.domain || "Domain DNS records"}
                  </p>
                </div>

                <Button
                  type="button"
                  unstyled
                  className={styles.vendorDomainCartCloseButton}
                    onClick={() => {
                      setShowDnsModal(false);
                      setShowDnsUpdateModal(false);
                    }}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </Button>
              </div>

              <div className={styles.vendorDomainDnsModalBody}>
                <div className={styles.vendorDomainDnsSummary}>
                  <span className={styles.vendorDomainDnsSummaryItem}>
                    Source: <strong>{dnsModalData?.source || "N/A"}</strong>
                  </span>
                  <span className={styles.vendorDomainDnsSummaryItem}>
                    Mode: <strong>{dnsModalData?.usingExternalDNS ? "External DNS" : "Managed DNS"}</strong>
                  </span>
                  <button
                    type="button"
                    className={styles.vendorDomainDnsUpdateButton}
                    onClick={handleOpenDnsUpdateModal}
                  >
                    Update DNS
                  </button>
                </div>

                <div className={styles.vendorDomainDnsTableWrap}>
                  <table className={styles.vendorDomainDnsTable}>
                    <thead>
                      <tr>
                        <th>Host ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Address</th>
                        <th>MX Pref</th>
                        <th>TTL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dnsRecords.length > 0 ? (
                        dnsRecords.map((record, index) => (
                          <tr key={record.hostId || `${record.name}-${record.type}-${index}`}>
                            <td>{record.hostId || "N/A"}</td>
                            <td>{record.name || "N/A"}</td>
                            <td>{record.type || "N/A"}</td>
                            <td>{record.address || "N/A"}</td>
                            <td>{record.mxPref || "N/A"}</td>
                            <td>{record.ttl || "N/A"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className={styles.vendorDomainDnsEmptyState}>
                            No DNS records found for this domain.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  const dnsUpdateModal =
    showDnsUpdateModal && typeof document !== "undefined"
      ? createPortal(
          <div
            className={styles.vendorDomainDnsEditorOverlay}
            onClick={() => setShowDnsUpdateModal(false)}
          >
            <div
              className={styles.vendorDomainDnsEditorModal}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.vendorDomainCartModalHeader}>
                <div>
                  <h3 className={styles.vendorDomainCartModalTitle}>Update DNS</h3>
                  <p className={styles.vendorDomainDnsModalSubtitle}>
                    {dnsModalData?.domain || "Edit DNS records"}
                  </p>
                </div>

                <Button
                  type="button"
                  unstyled
                  className={styles.vendorDomainCartCloseButton}
                  onClick={() => setShowDnsUpdateModal(false)}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </Button>
              </div>

              <div className={styles.vendorDomainDnsModalBody}>
                <div className={styles.vendorDomainDnsTableWrap}>
                  <table className={styles.vendorDomainDnsTable}>
                    <thead>
                      <tr>
                        <th>Host ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Address</th>
                        <th>MX Pref</th>
                        <th>TTL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dnsFormRecords.length > 0 ? (
                        dnsFormRecords.map((record, index) => (
                          <tr key={record.hostId || `dns-edit-${index}`}>
                            <td>
                              <input
                                type="text"
                                value={record.hostId}
                                onChange={(event) =>
                                  handleDnsRecordFieldChange(index, "hostId", event.target.value)
                                }
                                className={styles.vendorDomainDnsInput}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={record.name}
                                onChange={(event) =>
                                  handleDnsRecordFieldChange(index, "name", event.target.value)
                                }
                                className={styles.vendorDomainDnsInput}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={record.type}
                                onChange={(event) =>
                                  handleDnsRecordFieldChange(index, "type", event.target.value)
                                }
                                className={styles.vendorDomainDnsInput}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={record.address}
                                onChange={(event) =>
                                  handleDnsRecordFieldChange(index, "address", event.target.value)
                                }
                                className={styles.vendorDomainDnsInput}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={record.mxPref}
                                onChange={(event) =>
                                  handleDnsRecordFieldChange(index, "mxPref", event.target.value)
                                }
                                className={styles.vendorDomainDnsInput}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={record.ttl}
                                onChange={(event) =>
                                  handleDnsRecordFieldChange(index, "ttl", event.target.value)
                                }
                                className={styles.vendorDomainDnsInput}
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className={styles.vendorDomainDnsEmptyState}>
                            No DNS records available to update.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className={styles.vendorDomainDnsEditorActions}>
                  <Button
                    type="button"
                    unstyled
                    className={styles.vendorDomainDnsEditorSecondaryButton}
                    onClick={() => setShowDnsUpdateModal(false)}
                    disabled={isSubmittingDnsUpdate}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    variant="blueButton"
                    className={styles.vendorDomainDnsEditorPrimaryButton}
                    onClick={handleSubmitDnsUpdate}
                    disabled={isSubmittingDnsUpdate || dnsFormRecords.length === 0}
                  >
                    {isSubmittingDnsUpdate ? "Updating..." : "Save DNS Changes"}
                  </Button>
                </div>
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
        {dnsModal}
        {dnsUpdateModal}
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
        {dnsModal}
        {dnsUpdateModal}
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
        {dnsModal}
        {dnsUpdateModal}
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
    <div
      ref={pageRef}
      className={`${styles.vendorDomainPage} ${hasManagedDomains ? styles.vendorDomainPageWithPagination : ""}`}
    >
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
          <span className={styles.vendorDomainCount}>({totalManagedDomains})</span>
        </div>

        <div className={styles.vendorDomainDivider} />

        {hasManagedDomains ? (
          <div className={styles.vendorDomainGrid}>
            {managedDomains.map((domainItem) => {
              const domainName = resolveManagedDomainName(domainItem);
              const domainKey = domainItem.id || domainName;
              const linkedStoreCount = resolveLinkedStoreCount(domainItem);
              const linkedStoreId = resolveLinkedStoreId(domainItem);
              const linkedStoreName = resolveLinkedStoreName(domainItem);
              const isActionMenuOpen = activeDomainActionId === domainKey;
              const isLinkingStore =
                linkingDomainId !== null && linkingDomainId === resolveManagedDomainId(domainItem);
              const isUnlinkingStore =
                unlinkingDomainId !== null &&
                unlinkingDomainId === resolveManagedDomainId(domainItem);
              const isStoreLinked = Boolean(linkedStoreId);
              const isDnsLoading =
                dnsLoadingDomainId !== null &&
                dnsLoadingDomainId === resolveManagedDomainId(domainItem);
              const isSslLoading =
                sslLoadingDomainId !== null &&
                sslLoadingDomainId === resolveManagedDomainId(domainItem);
              const isActivatingSsl =
                activatingSslDomainId !== null &&
                activatingSslDomainId === resolveManagedDomainId(domainItem);

              return (
                <article key={domainKey} className={styles.vendorDomainListCard}>
                  <div className={styles.vendorDomainListCardHeader}>
                    <div className={styles.vendorDomainListCardMeta}>
                      <h3 className={styles.vendorDomainListCardTitle}>
                        {domainName}
                      </h3>
                      <p className={styles.vendorDomainListCardExpiry}>
                        Expires {formatManagedDomainDate(domainItem.expiration_date)}
                      </p>
                    </div>

                    <div
                      className={styles.vendorDomainListCardHeaderActions}
                      data-domain-action-menu="true"
                    >
                      <button
                        type="button"
                        className={styles.vendorDomainListCardMenu}
                        aria-label={`Manage ${domainName}`}
                        aria-haspopup="menu"
                        aria-expanded={isActionMenuOpen}
                        onClick={() =>
                          setActiveDomainActionId((currentId) =>
                            currentId === domainKey ? null : domainKey
                          )
                        }
                      >
                        <FontAwesomeIcon icon={faEllipsisVertical} />
                      </button>

                      {isActionMenuOpen && (
                        <div
                          className={styles.vendorDomainListActionsMenu}
                          role="menu"
                          aria-label={`Actions for ${domainName}`}
                        >
                          <div className={styles.vendorDomainListActionsMenuTitle}>
                            Actions
                          </div>

                          <button
                            type="button"
                            className={styles.vendorDomainListActionsMenuItem}
                            role="menuitem"
                            onClick={() => handleToggleStoreLink(domainItem)}
                            disabled={isLinkingStore || isUnlinkingStore || isStoreLinked}
                          >
                            <FontAwesomeIcon icon={faLink} />
                            <span>
                              {isLinkingStore
                                ? "Linking Store..."
                                : isStoreLinked
                                  ? "Store Linked"
                                  : "Link Store"}
                            </span>
                          </button>

                          <button
                            type="button"
                            className={`${styles.vendorDomainListActionsMenuItem} ${styles.vendorDomainListActionsMenuItemDanger}`}
                            role="menuitem"
                            onClick={() => handleUnlinkStore(domainItem)}
                            disabled={isLinkingStore || isUnlinkingStore || !isStoreLinked}
                          >
                            <FontAwesomeIcon icon={faLink} />
                            <span>
                              {isUnlinkingStore ? "Unlinking Store..." : "Unlink Store"}
                            </span>
                          </button>

                          <button
                            type="button"
                            className={styles.vendorDomainListActionsMenuItem}
                            role="menuitem"
                            onClick={() => handleManageDns(domainItem)}
                            disabled={isLinkingStore || isUnlinkingStore || isDnsLoading}
                          >
                            <FontAwesomeIcon icon={faGear} />
                            <span>{isDnsLoading ? "Loading DNS..." : "Manage DNS"}</span>
                          </button>

                          <button
                            type="button"
                            className={styles.vendorDomainListActionsMenuItem}
                            role="menuitem"
                            onClick={() => handleAddSsl(domainItem)}
                            disabled={
                              isLinkingStore ||
                              isUnlinkingStore ||
                              isDnsLoading ||
                              isSslLoading ||
                              domainItem.ssl_enabled
                            }
                          >
                            <FontAwesomeIcon icon={faCircleCheck} />
                            <span>
                              {isSslLoading
                                ? "Adding SSL..."
                                : domainItem.ssl_enabled
                                  ? "SSL Active"
                                  : "Add SSL"}
                            </span>
                          </button>

                          <button
                            type="button"
                            className={styles.vendorDomainListActionsMenuItem}
                            role="menuitem"
                            onClick={() => handleActivateSsl(domainItem)}
                            disabled={
                              isLinkingStore ||
                              isUnlinkingStore ||
                              isDnsLoading ||
                              isSslLoading ||
                              isActivatingSsl
                            }
                          >
                            <FontAwesomeIcon icon={faCircleInfo} />
                            <span>
                              {isActivatingSsl ? "Activating SSL..." : "Activate SSL"}
                            </span>
                          </button>

                          <button
                            type="button"
                            className={styles.vendorDomainListActionsMenuItem}
                            role="menuitem"
                            onClick={() => setActiveDomainActionId(null)}
                          >
                            <FontAwesomeIcon icon={faEye} />
                            <span>View Details</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.vendorDomainListDivider} />

                  <div className={styles.vendorDomainListCardBody}>
                    <div className={styles.vendorDomainListLinkRow}>
                      <span className={styles.vendorDomainListLinkLabel}>
                        <FontAwesomeIcon icon={faLink} />
                        <span>Linked Store ({linkedStoreCount})</span>
                      </span>

                      <div className={styles.vendorDomainListBadgeRow}>
                        <span
                          className={`${styles.vendorDomainListStatusBadge} ${resolveDomainStatusClassName(domainItem.status)}`.trim()}
                        >
                          {formatDomainStatusLabel(domainItem.status)}
                        </span>

                        {domainItem.ssl_enabled && (
                          <span className={styles.vendorDomainListSslBadge}>
                            SSL Active
                          </span>
                        )}
                      </div>
                    </div>

                    {linkedStoreName && (
                      <span
                        className={`${styles.vendorDomainListStoreChip} ${styles.vendorDomainListStoreChipLinked}`}
                      >
                        {linkedStoreName}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <article className={styles.vendorDomainCard}>
            <div className={styles.vendorDomainCardInner}>
              <div className={styles.vendorDomainIconWrap} aria-hidden="true">
                <FontAwesomeIcon icon={faGlobe} />
              </div>

              <h3 className={styles.vendorDomainEmptyTitle}>
                {loading ? "Loading your domains" : "No active domain available"}
              </h3>
              <p className={styles.vendorDomainEmptyText}>
                {loading
                  ? "Fetching your registered domains."
                  : "Expand your business by linking your store to your domain"}
              </p>

              {!loading && (
                <Button
                  type="button"
                  unstyled
                  className={styles.vendorDomainCta}
                  onClick={() => setShowDomainSearch(true)}
                >
                  Get a Domain
                </Button>
              )}
            </div>
          </article>
        )}

        {!hasManagedDomains && error && !loading && (
          <p className={styles.vendorDomainEmptyText}>
            {error?.message || error?.error || error || "Unable to load domains right now."}
          </p>
        )}
      </section>

      {hasManagedDomains && (
        <Pagination
          currentPage={currentPage}
          totalPages={managedDomainsPagination?.totalPages || 1}
          onPageChange={handleDomainPageChange}
          itemsPerPage={managedDomainsPagination?.limit || 20}
          totalItems={managedDomainsPagination?.totalItems || totalManagedDomains}
          disabled={loading}
          className={styles.vendorDomainPaginationSticky}
          containerStyle={paginationViewportStyle}
          showPrevNextLabels
        />
      )}

      {dnsModal}
      {dnsUpdateModal}
    </div>
  );
};

export default Domain;
