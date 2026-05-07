const WHATSAPP_PLAN_PAYMENT_CONTEXT_KEY = "mycroshop.pendingWhatsappPlanPayment";
const WHATSAPP_PLAN_PAYMENT_INFLIGHT_KEY = "mycroshop.whatsappPlanPaymentInFlight";
const VENDOR_ACTIVE_TAB_KEY = "mycroshop.vendorActiveTab";
const WHATSAPP_OAUTH_AUTH_URL_KEY = "mycroshop.whatsappOauthAuthUrl";
const WHATSAPP_OAUTH_STATE_KEY = "whatsapp_oauth_state";

export const readStoredVendorUser = () => {
  if (typeof window === "undefined") return null;

  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

export const resolveVendorEmail = (user = {}, fallback = {}) =>
  user?.email ||
  user?.adminEmail ||
  user?.admin_email ||
  user?.user?.email ||
  fallback?.email ||
  fallback?.store_email ||
  fallback?.business_email ||
  fallback?.admin_email ||
  "";

export const buildWhatsappPlanSuccessUrl = () => {
  if (typeof window === "undefined") {
    return "/vendor/whatsapp-link";
  }

  return `${window.location.origin}/vendor/whatsapp-link`;
};

export const writeWhatsappPlanPaymentContext = (context) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      WHATSAPP_PLAN_PAYMENT_CONTEXT_KEY,
      JSON.stringify({
        ...context,
        createdAt: new Date().toISOString(),
      })
    );
    localStorage.setItem(WHATSAPP_PLAN_PAYMENT_INFLIGHT_KEY, "true");
    localStorage.setItem(VENDOR_ACTIVE_TAB_KEY, "settings");
  } catch {
    // Ignore storage errors
  }
};

export const readWhatsappPlanPaymentContext = () => {
  if (typeof window === "undefined") return null;

  try {
    const rawContext = localStorage.getItem(WHATSAPP_PLAN_PAYMENT_CONTEXT_KEY);
    return rawContext ? JSON.parse(rawContext) : null;
  } catch {
    return null;
  }
};

export const clearWhatsappPlanPaymentContext = () => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(WHATSAPP_PLAN_PAYMENT_CONTEXT_KEY);
    localStorage.removeItem(WHATSAPP_PLAN_PAYMENT_INFLIGHT_KEY);
  } catch {
    // Ignore storage errors
  }
};

export const clearWhatsappPlanPaymentInFlight = () => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(WHATSAPP_PLAN_PAYMENT_INFLIGHT_KEY);
  } catch {
    // Ignore storage errors
  }
};

export const writeWhatsappOauthSession = ({ authUrl, state }) => {
  if (typeof window === "undefined") return;

  try {
    if (authUrl) {
      localStorage.setItem(WHATSAPP_OAUTH_AUTH_URL_KEY, authUrl);
    }

    if (state) {
      localStorage.setItem(WHATSAPP_OAUTH_STATE_KEY, state);
    }
  } catch {
    // Ignore storage errors
  }
};

export const readWhatsappOauthSession = () => {
  if (typeof window === "undefined") {
    return {
      authUrl: "",
      state: "",
    };
  }

  try {
    return {
      authUrl: localStorage.getItem(WHATSAPP_OAUTH_AUTH_URL_KEY) || "",
      state: localStorage.getItem(WHATSAPP_OAUTH_STATE_KEY) || "",
    };
  } catch {
    return {
      authUrl: "",
      state: "",
    };
  }
};

export const clearWhatsappOauthSession = () => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(WHATSAPP_OAUTH_AUTH_URL_KEY);
    localStorage.removeItem(WHATSAPP_OAUTH_STATE_KEY);
  } catch {
    // Ignore storage errors
  }
};

export const readPendingWhatsappPlanPayment = () => {
  if (typeof window === "undefined") return null;

  let rawPaymentContext = "";
  let isPaymentInFlight = false;

  try {
    rawPaymentContext = localStorage.getItem(WHATSAPP_PLAN_PAYMENT_CONTEXT_KEY) || "";
    isPaymentInFlight =
      localStorage.getItem(WHATSAPP_PLAN_PAYMENT_INFLIGHT_KEY) === "true";
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

  if (
    !paymentReference &&
    !successfulStatuses.includes(paymentStatus) &&
    !(isPaymentInFlight && paystackReferrer)
  ) {
    return null;
  }

  try {
    return JSON.parse(rawPaymentContext);
  } catch {
    return null;
  }
};
