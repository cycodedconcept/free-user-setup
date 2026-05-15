import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowTrendUp,
  faBolt,
  faBuilding,
  faChartLine,
  faCheck,
  faComments,
  faCreditCard,
  faLightbulb,
  faMessage,
  faPhone,
  faRotateRight,
  faUsers,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { Logo } from "../../../assets";
import {
  getWhatsappPlans,
  subscribeWhatsappPlan,
} from "../../../slice/whatsappPlanSlice";
import {
  clearWhatsappPlanPaymentInFlight,
  readPendingWhatsappPlanPayment,
  readStoredVendorUser,
  readWhatsappPlanPaymentContext,
  resolveVendorEmail,
  writeWhatsappPlanPaymentContext,
} from "../settings/whatsappPlanPayment";

const BACKEND_URL = "https://backend.mycroshop.com";
const META_CONFIG_ID = "1108344128008490";
const VENDOR_ACTIVE_TAB_KEY = "mycroshop.vendorActiveTab";
const STATUS_PLAN_KEY = "statusPlan";
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ENTERPRISE_EMAIL = "sales@mycroshop.com";
const ENTERPRISE_WHATSAPP_LINK =
  "https://wa.me/?text=Hi%20Mycroshop%20Sales%2C%20I%27m%20interested%20in%20the%20Enterprise%20AI%20Sales%20Agent%20plan.";

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const BILLING_OPTIONS = [
  {
    key: "monthly",
    label: "Monthly",
    shortLabel: "1 mo.",
    months: 1,
    discount: 0,
  },
  {
    key: "yearly",
    label: "Yearly",
    shortLabel: "12 mo.",
    months: 12,
    discount: 20,
  },
];

const UPGRADE_MONTH_OPTIONS = [1, 3, 6, 12];

const PLAN_ICON_PRESETS = [
  { icon: faBolt, bgClass: "ic1" },
  { icon: faChartLine, bgClass: "ic2" },
  { icon: faMessage, bgClass: "ic3" },
  { icon: faBuilding, bgClass: "ic4" },
];

const resolveStoreInfo = (myStore) =>
  myStore?.onlineStore ||
  myStore?.data?.onlineStore ||
  myStore?.store ||
  {};

const parsePlanFeatures = (features) => {
  if (Array.isArray(features)) {
    return features;
  }

  if (typeof features !== "string") {
    return [];
  }

  try {
    const parsedFeatures = JSON.parse(features);
    return Array.isArray(parsedFeatures) ? parsedFeatures : [];
  } catch {
    return features ? [features] : [];
  }
};

const formatPlanLimit = (value, fallback = "Unlimited") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toLocaleString("en-NG") : String(value);
};

const parseAmount = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const stripped = value.replace(/[^0-9.]/g, "");
  if (!stripped) {
    return null;
  }

  const parsed = Number(stripped);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolvePlanAmount = (plan) => {
  const candidates = [
    plan?.price,
    plan?.amount,
    plan?.monthly_price,
    plan?.plan_price,
    plan?.price_amount,
    plan?.price_display,
  ];

  for (const candidate of candidates) {
    const amount = parseAmount(candidate);
    if (amount !== null) {
      return amount;
    }
  }

  return null;
};

const formatCurrency = (value, fallback = "Custom pricing") =>
  typeof value === "number" && Number.isFinite(value)
    ? currencyFormatter.format(value)
    : fallback;

const resolvePlanDescription = (plan) =>
  plan?.best_for ||
  plan?.description ||
  plan?.plan_description ||
  "Flexible automation for customer conversations on WhatsApp.";

const resolveWhatsappNumberLimit = (plan) => {
  if (plan?.is_custom) {
    return plan?.max_whatsapp_numbers ? `${plan.max_whatsapp_numbers}+` : "Custom";
  }

  return formatPlanLimit(plan?.max_whatsapp_numbers, "0");
};

const normalizeStatus = (value) => {
  const status = String(value || "").trim().toLowerCase();

  if (!status) {
    return "";
  }

  if (["active", "paid", "successful", "current", "connected"].includes(status)) {
    return "active";
  }

  if (["expired", "inactive", "ended", "cancelled"].includes(status)) {
    return "expired";
  }

  return status;
};

const buildSalesAgentSuccessUrl = () => {
  if (typeof window === "undefined") {
    return "/ai/sales-agent";
  }

  return `${window.location.origin}/ai/sales-agent`;
};

const resolveDateLabel = (value) => {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime())
    ? ""
    : parsedDate.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
};

const formatConnectedPhone = (phoneNumber) => {
  const value = String(phoneNumber || "").trim();
  if (!value) {
    return "";
  }

  return value.startsWith("+") ? value : `+${value}`;
};

const readStatusPlanSnapshot = () => {
  if (typeof window === "undefined") {
    return {
      profile: null,
      whatsapp: null,
      subscription: null,
      isConnected: false,
      activePlanSlug: null,
      phoneNumber: "",
      normalizedStatus: "",
    };
  }

  try {
    const rawProfile = localStorage.getItem(STATUS_PLAN_KEY);
    const profile = rawProfile ? JSON.parse(rawProfile) : null;
    const whatsapp = profile?.data?.whatsapp ?? null;
    const subscription = whatsapp?.subscription ?? null;

    return {
      profile,
      whatsapp,
      subscription,
      isConnected: whatsapp?.connected === true,
      activePlanSlug: subscription?.plan_slug ?? null,
      phoneNumber: whatsapp?.phone_number ?? "",
      normalizedStatus: normalizeStatus(subscription?.status),
    };
  } catch {
    return {
      profile: null,
      whatsapp: null,
      subscription: null,
      isConnected: false,
      activePlanSlug: null,
      phoneNumber: "",
      normalizedStatus: "",
    };
  }
};

const getErrorMessage = (error, fallbackMessage) => {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object") {
    return (
      error.message ||
      error.error ||
      error?.data?.message ||
      error?.data?.error ||
      fallbackMessage
    );
  }

  return fallbackMessage;
};

const resolvePlanIconPreset = (plan, index) => {
  const slug = String(plan?.slug || plan?.name || "").toLowerCase();

  if (slug.includes("starter")) {
    return PLAN_ICON_PRESETS[0];
  }

  if (slug.includes("growth")) {
    return PLAN_ICON_PRESETS[1];
  }

  if (slug.includes("scale")) {
    return PLAN_ICON_PRESETS[2];
  }

  if (slug.includes("enterprise")) {
    return PLAN_ICON_PRESETS[3];
  }

  return PLAN_ICON_PRESETS[index % PLAN_ICON_PRESETS.length];
};

const calculateSummary = (plan, billingOption) => {
  const monthlyAmount = resolvePlanAmount(plan);

  if (monthlyAmount === null) {
    return {
      monthlyAmount: null,
      subtotal: null,
      discountAmount: null,
      total: null,
    };
  }

  const subtotal = monthlyAmount * billingOption.months;
  const discountAmount = subtotal * (billingOption.discount / 100);
  const total = subtotal - discountAmount;

  return {
    monthlyAmount,
    subtotal,
    discountAmount,
    total,
  };
};

const calculateUpgradePreview = (currentPlan, targetPlan, subscription) => {
  const targetMonthlyAmount = resolvePlanAmount(targetPlan) || 0;
  const currentMonthlyAmount = resolvePlanAmount(currentPlan) || 0;
  const now = new Date();
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const periodStart = subscription?.current_period_start
    ? new Date(subscription.current_period_start)
    : null;

  const daysRemaining = periodEnd
    ? Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / DAY_IN_MS))
    : 0;
  const cycleDays =
    periodStart && periodEnd
      ? Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / DAY_IN_MS))
      : 30;

  const creditAmount =
    daysRemaining > 0 ? currentMonthlyAmount * (daysRemaining / cycleDays) : 0;
  const payToday = Math.max(0, targetMonthlyAmount - creditAmount);

  return {
    currentPlanName: subscription?.plan_name || currentPlan?.name || "Current Plan",
    targetPlanName: targetPlan?.name || "Target Plan",
    daysRemaining,
    cycleDays,
    currentMonthlyAmount,
    targetMonthlyAmount,
    creditAmount,
    payToday,
    nextRenewalTotal: targetMonthlyAmount,
  };
};

const SalesAgent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userToken = localStorage.getItem("token") || "";
  const token = userToken;
  const {
    loading: whatsappPlansLoading,
    error: whatsappPlansError,
    plans: whatsappPlans,
    subscribeLoading: whatsappSubscribeLoading,
  } = useSelector((state) => state.whatsappPlan);
  const storeInfo = resolveStoreInfo(useSelector((state) => state.store?.myStore));

  const [statusPlanState, setStatusPlanState] = useState(() => readStatusPlanSnapshot());
  const [connectedNumber, setConnectedNumber] = useState(() => {
    const snapshot = readStatusPlanSnapshot();
    return snapshot.isConnected ? snapshot.phoneNumber || "" : "";
  });
  const [isWhatsappConnected, setIsWhatsappConnected] = useState(() => {
    const snapshot = readStatusPlanSnapshot();
    return snapshot.isConnected === true;
  });
  const [paymentContext, setPaymentContext] = useState(() =>
    readWhatsappPlanPaymentContext()
  );
  const [billingKey, setBillingKey] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [upgradeTargetPlan, setUpgradeTargetPlan] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [activeModal, setActiveModal] = useState("");
  const [paymentNotice, setPaymentNotice] = useState("");
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentLoadingPlanId, setPaymentLoadingPlanId] = useState("");
  const [connectError, setConnectError] = useState("");
  const [connecting, setConnecting] = useState(false);

  const refreshStatusPlan = () => {
    setStatusPlanState(readStatusPlanSnapshot());
  };

  const showSignupToast = (icon, title) =>
    Swal.fire({
      toast: true,
      position: "top-end",
      icon,
      title,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });

  async function checkConnectionStatus() {
    if (!userToken) {
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/meta-connection/status`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const result = await res.json();

      if (result.data?.whatsapp?.connected) {
        setIsWhatsappConnected(true);
        setConnectedNumber(result.data.whatsapp.phone_number || "");
        return;
      }

      setIsWhatsappConnected(false);
      setConnectedNumber("");
    } catch {
      // Keep the local snapshot state when the refresh request fails.
    }
  }

  async function handleSignupComplete(event) {
    const { waba_id, phone_number_id } = event.detail || {};

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/v1/meta-connection/whatsapp/callback` +
          `?waba_id=${encodeURIComponent(waba_id || "")}&phone_number_id=${encodeURIComponent(
            phone_number_id || ""
          )}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
      const result = await res.json();

      if (result.success) {
        setIsWhatsappConnected(true);
        setConnectedNumber(result.data?.phone_number || "");
        setConnectError("");
        refreshStatusPlan();
        await showSignupToast("success", "WhatsApp connected successfully");
      } else {
        setConnectError(
          getErrorMessage(result, "WhatsApp signup failed. Please try again.")
        );
        await showSignupToast(
          "error",
          getErrorMessage(result, "WhatsApp signup failed. Please try again.")
        );
        setConnecting(false);
      }
    } catch (err) {
      setConnectError("Could not reach server. Try again.");
      await showSignupToast("error", "Could not reach server. Try again.");
      setConnecting(false);
    } finally {
      setConnecting(false);
    }
  }

  async function handleSignupCancelled() {
    setConnecting(false);
    setConnectError("");
    await showSignupToast("info", "WhatsApp connection was cancelled.");
  }

  async function handleSignupError() {
    setConnecting(false);
    setConnectError("WhatsApp signup failed. Please try again.");
    await showSignupToast("error", "WhatsApp signup failed. Please try again.");
  }

  function launchSignup() {
    setConnectError("");
    setConnecting(true);

    if (!userToken) {
      setConnecting(false);
      navigate("/vendor/login", { replace: true });
      return;
    }

    const fb = typeof window !== "undefined" ? window.FB : undefined;

    if (!fb) {
      setConnectError("Facebook is still loading. Please try again.");
      setConnecting(false);
      return;
    }

    fb.login(
      function(response) {
        if (!response.authResponse) {
          setConnecting(false);
        }
      },
      {
        config_id: META_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: "3",
        },
      }
    );
  }

  useEffect(() => {
    try {
      localStorage.setItem(VENDOR_ACTIVE_TAB_KEY, "sales-agent");
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (!token) {
      navigate("/vendor/login", { replace: true });
      return;
    }

    dispatch(getWhatsappPlans({ token }));
  }, [dispatch, navigate, token]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleStorageChange = (event) => {
      if (!event.key || event.key === STATUS_PLAN_KEY) {
        refreshStatusPlan();
      }
    };

    const handleFocus = () => {
      refreshStatusPlan();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshStatusPlan();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    checkConnectionStatus();

    window.addEventListener("whatsapp_signup_complete", handleSignupComplete);
    window.addEventListener("whatsapp_signup_cancelled", handleSignupCancelled);
    window.addEventListener("whatsapp_signup_error", handleSignupError);

    return () => {
      window.removeEventListener("whatsapp_signup_complete", handleSignupComplete);
      window.removeEventListener("whatsapp_signup_cancelled", handleSignupCancelled);
      window.removeEventListener("whatsapp_signup_error", handleSignupError);
    };
  }, []);

  useEffect(() => {
    const pendingPayment = readPendingWhatsappPlanPayment();

    if (!pendingPayment) {
      return;
    }

    setPaymentContext(pendingPayment);
    setPaymentCompleted(true);
    setPaymentNotice("Payment successful! Your AI Sales Agent is now active.");
    clearWhatsappPlanPaymentInFlight();
    refreshStatusPlan();

    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (token) {
      dispatch(getWhatsappPlans({ token }));
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (!paymentNotice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setPaymentNotice("");
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [paymentNotice]);

  const subscriberEmail = resolveVendorEmail(readStoredVendorUser(), storeInfo);
  const selectedBillingOption =
    BILLING_OPTIONS.find((option) => option.key === billingKey) || BILLING_OPTIONS[0];
  const hasSubscriptionObject = Boolean(statusPlanState.subscription);
  const hasActiveSubscription = statusPlanState.normalizedStatus === "active";
  const paymentContextPlan =
    whatsappPlans.find(
      (plan) =>
        (paymentContext?.planId && String(plan.id) === String(paymentContext.planId)) ||
        (paymentContext?.planSlug &&
          String(plan.slug || "").toLowerCase() ===
            String(paymentContext.planSlug || "").toLowerCase())
    ) || null;
  const effectivePlanSlug =
    (hasActiveSubscription && statusPlanState.activePlanSlug) ||
    (paymentCompleted ? paymentContext?.planSlug || null : null);
  const activePlan =
    whatsappPlans.find(
      (plan) =>
        effectivePlanSlug &&
        String(plan.slug || "").toLowerCase() === String(effectivePlanSlug).toLowerCase()
    ) || paymentContextPlan;
  const activePlanAmount = resolvePlanAmount(activePlan);
  const canShowSubscriptionState = hasActiveSubscription || paymentCompleted;
  const isConnected = isWhatsappConnected;
  const screenState = isConnected
    ? "connected"
    : canShowSubscriptionState
      ? "post-payment"
      : "default";
  const activeStep = screenState === "default" ? 1 : 3;
  const bannerPlanName =
    statusPlanState.subscription?.plan_name ||
    activePlan?.name ||
    paymentContext?.planName ||
    "Selected Plan";
  const bannerStatus = normalizeStatus(
    statusPlanState.subscription?.status || (canShowSubscriptionState ? "active" : "")
  );
  const bannerFollowUpsUsed = Number(
    statusPlanState.subscription?.follow_ups_used || 0
  );
  const bannerFollowUpLimit = Number(
    statusPlanState.subscription?.follow_up_limit ||
      activePlan?.follow_up_limit ||
      0
  );
  const bannerProgressWidth =
    bannerFollowUpLimit > 0
      ? Math.min(100, Math.round((bannerFollowUpsUsed / bannerFollowUpLimit) * 100))
      : 0;
  const bannerExpiryDate =
    resolveDateLabel(statusPlanState.subscription?.current_period_end) ||
    (paymentCompleted && paymentContext?.billingMonths
      ? resolveDateLabel(
          new Date(
            Date.now() + paymentContext.billingMonths * 30 * DAY_IN_MS
          ).toISOString()
        )
      : "");
  const connectedPhoneNumber = formatConnectedPhone(connectedNumber);
  const subscribeSummary = calculateSummary(selectedPlan, selectedBillingOption);
  const upgradePreview = calculateUpgradePreview(
    activePlan,
    upgradeTargetPlan,
    statusPlanState.subscription
  );
  const upgradeMonthlyAmount = resolvePlanAmount(upgradeTargetPlan);
  const upgradeTotalAmount =
    typeof upgradeMonthlyAmount === "number"
      ? upgradeMonthlyAmount * selectedMonths
      : null;

  const resetAllModals = () => {
    setActiveModal("");
    setSelectedPlan(null);
    setUpgradeTargetPlan(null);
    setSelectedMonths(1);
    setBillingKey("monthly");
  };

  const handleRefreshPlans = () => {
    if (!token) {
      return;
    }

    dispatch(getWhatsappPlans({ token }));
  };

  const handleOpenSubscribeModal = (plan) => {
    setSelectedPlan(plan);
    setBillingKey("monthly");
    setActiveModal("subscribe");
  };

  const handleSelectPlan = async (plan) => {
    if (!plan || paymentLoading) {
      return;
    }

    try {
      setPaymentLoadingPlanId(String(plan.id || plan.slug || plan.name || ""));
      setPaymentLoading(true);

      const result = await dispatch(
        subscribeWhatsappPlan({
          token,
          plan_id: String(plan.id),
          email: subscriberEmail,
          callback_url: buildSalesAgentSuccessUrl(),
        })
      ).unwrap();

      if (result?.data?.authorization_url) {
        writeWhatsappPlanPaymentContext({
          planId: plan.id,
          planName: plan.name,
          planSlug: plan.slug,
          email: subscriberEmail,
          reference: result?.data?.reference || "",
          token,
          mode: "subscribe",
          billingKey: "monthly",
          billingLabel: "Monthly",
          billingMonths: 1,
          discountRate: 0,
          subtotal: resolvePlanAmount(plan),
          discountAmount: 0,
          total: resolvePlanAmount(plan),
        });

        try {
          localStorage.setItem(VENDOR_ACTIVE_TAB_KEY, "sales-agent");
        } catch {
          // Ignore storage errors
        }

        window.location.href = result.data.authorization_url;
        return;
      }

      throw new Error("The payment link was not returned by the server.");
    } catch (err) {
      console.error("Subscription failed", err);
      await Swal.fire({
        icon: "error",
        title: "Unable to start payment",
        text: getErrorMessage(
          err,
          "Something went wrong while starting your AI Sales Agent payment."
        ),
        confirmButtonColor: "#0057FF",
      });
    } finally {
      setPaymentLoading(false);
      setPaymentLoadingPlanId("");
    }
  };

  const handleOpenUpgradeModal = (plan) => {
    setUpgradeTargetPlan(plan);
    setSelectedMonths(1);
    setActiveModal("upgrade");
  };

  const handleOpenEnterpriseModal = () => {
    setActiveModal("enterprise");
  };

  const startPlanPayment = async (plan, billingOption, mode = "subscribe") => {
    if (!plan) {
      return;
    }

    if (!token) {
      await Swal.fire({
        icon: "error",
        title: "Not authenticated",
        text: "Please log in again before starting your AI Sales Agent payment.",
        confirmButtonColor: "#0057FF",
      });
      return;
    }

    if (!subscriberEmail) {
      await Swal.fire({
        icon: "warning",
        title: "Email required",
        text: "We couldn't find your account email. Please log in again and try once more.",
        confirmButtonColor: "#0057FF",
      });
      return;
    }

    const summary = calculateSummary(plan, billingOption);

    try {
      const response = await dispatch(
        subscribeWhatsappPlan({
          token,
          plan_id: String(plan.id),
          email: subscriberEmail,
          callback_url: buildSalesAgentSuccessUrl(),
        })
      ).unwrap();

      const authorizationUrl =
        response?.data?.payment?.authorization_url ||
        response?.data?.authorization_url ||
        response?.authorization_url ||
        "";

      if (!authorizationUrl) {
        throw new Error("The payment link was not returned by the server.");
      }

      writeWhatsappPlanPaymentContext({
        planId: plan.id,
        planName: plan.name,
        planSlug: plan.slug,
        email: subscriberEmail,
        reference: response?.data?.reference || "",
        token,
        mode,
        billingKey: billingOption.key,
        billingLabel: billingOption.label,
        billingMonths: billingOption.months,
        discountRate: billingOption.discount,
        subtotal: summary.subtotal,
        discountAmount: summary.discountAmount,
        total: summary.total,
      });

      try {
        localStorage.setItem(VENDOR_ACTIVE_TAB_KEY, "sales-agent");
      } catch {
        // Ignore storage errors
      }

      resetAllModals();
      window.location.assign(authorizationUrl);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Unable to start payment",
        text: getErrorMessage(
          error,
          "Something went wrong while starting your AI Sales Agent payment."
        ),
        confirmButtonColor: "#0057FF",
      });
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      return;
    }

    await startPlanPayment(selectedPlan, selectedBillingOption, "subscribe");
  };

  const handleUpgrade = async () => {
    if (!upgradeTargetPlan) {
      return;
    }

    if (!token) {
      await Swal.fire({
        icon: "error",
        title: "Not authenticated",
        text: "Please log in again before starting your AI Sales Agent upgrade.",
        confirmButtonColor: "#0057FF",
      });
      return;
    }

    setPaymentLoading(true);

    try {
      const upgradeRequestPayload = {
        plan_id: String(upgradeTargetPlan.id),
        months: selectedMonths,
        email: subscriberEmail || "",
      };

      console.log("AI Sales Agent upgrade payload:", upgradeRequestPayload);

      const result = await dispatch(
        subscribeWhatsappPlan({
          token,
          ...upgradeRequestPayload,
          callback_url: buildSalesAgentSuccessUrl(),
        })
      ).unwrap();

      const authorizationUrl =
        result?.data?.authorization_url ||
        result?.data?.payment?.authorization_url ||
        result?.authorization_url ||
        "";

      if (!authorizationUrl) {
        throw new Error("The payment link was not returned by the server.");
      }

      writeWhatsappPlanPaymentContext({
        planId: upgradeTargetPlan.id,
        planName: upgradeTargetPlan.name,
        planSlug: upgradeTargetPlan.slug,
        email: subscriberEmail || "",
        reference: result?.data?.reference || "",
        token,
        mode: "upgrade",
        billingKey: `${selectedMonths}-month`,
        billingLabel: `${selectedMonths} ${selectedMonths === 1 ? "month" : "months"}`,
        billingMonths: selectedMonths,
        discountRate: 0,
        subtotal: upgradeTotalAmount,
        discountAmount: 0,
        total: upgradeTotalAmount,
      });

      try {
        localStorage.setItem(VENDOR_ACTIVE_TAB_KEY, "sales-agent");
      } catch {
        // Ignore storage errors
      }

      window.location.href = authorizationUrl;
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Unable to start upgrade",
        text: getErrorMessage(
          err,
          "Something went wrong while starting your AI Sales Agent upgrade."
        ),
        confirmButtonColor: "#0057FF",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleHowItWorksConfirm = async () => {
    setActiveModal("");
    launchSignup();
  };

  const resolvePlanButtonState = (plan, planIndex) => {
    const planAmount = resolvePlanAmount(plan);
    const isCurrentPlan =
      canShowSubscriptionState &&
      bannerStatus === "active" &&
      effectivePlanSlug &&
      String(plan.slug || "").toLowerCase() ===
        String(effectivePlanSlug).toLowerCase();
    const isPopular =
      Boolean(plan?.is_popular || plan?.recommended || plan?.is_recommended) ||
      (!canShowSubscriptionState &&
        /growth/i.test(String(plan?.name || plan?.slug || ""))) ||
      (!canShowSubscriptionState && planIndex === 1);
    const isHigherTier =
      canShowSubscriptionState &&
      bannerStatus === "active" &&
      !isCurrentPlan &&
      typeof activePlanAmount === "number" &&
      typeof planAmount === "number" &&
      planAmount > activePlanAmount;
    const isLowerTier =
      canShowSubscriptionState &&
      bannerStatus === "active" &&
      !isCurrentPlan &&
      typeof activePlanAmount === "number" &&
      typeof planAmount === "number" &&
      planAmount < activePlanAmount;

    if (plan?.is_custom || planAmount === null) {
      return {
        label: "Contact Sales",
        buttonClass: "pb-dark",
        cardClass: "",
        badgeClass: "",
        disabled: false,
        note: "",
        isPopular,
        isCurrentPlan: false,
        isHigherTier: false,
        isLowerTier: false,
        onClick: () => handleOpenEnterpriseModal(),
      };
    }

    if (isCurrentPlan) {
      return {
        label: "✓ Current Plan",
        buttonClass: "pb-disabled",
        cardClass: "curr",
        badgeClass: "curr-b",
        disabled: true,
        note: "",
        isPopular: false,
        isCurrentPlan: true,
        isHigherTier: false,
        isLowerTier: false,
        onClick: undefined,
      };
    }

    if (isHigherTier) {
      return {
        label: "Upgrade",
        buttonClass: "pb-upgrade",
        cardClass: "",
        badgeClass: "",
        disabled: false,
        note: "",
        isPopular: false,
        isCurrentPlan: false,
        isHigherTier: true,
        isLowerTier: false,
        onClick: () => handleOpenUpgradeModal(plan),
      };
    }

    if (isLowerTier) {
      return {
        label: "Downgrade",
        buttonClass: "pb-down",
        cardClass: "",
        badgeClass: "",
        disabled: true,
        note: "Downgrading is only available at the end of your current billing period.",
        isPopular: false,
        isCurrentPlan: false,
        isHigherTier: false,
        isLowerTier: true,
        onClick: undefined,
      };
    }

    return {
      label: "Get Started",
      buttonClass: isPopular ? "pb-primary" : "pb-outline",
      cardClass: isPopular ? "pop" : "",
      badgeClass: isPopular ? "pop-b" : "",
      disabled: false,
      isGetStarted: true,
      note: "",
      isPopular,
      isCurrentPlan: false,
      isHigherTier: false,
      isLowerTier: false,
      onClick: () => handleSelectPlan(plan),
    };
  };

  const renderSubscriptionBanner = () => {
    if (!hasSubscriptionObject && !paymentCompleted) {
      return null;
    }

    const statusClass =
      bannerStatus === "expired" ? "status-p sp-expired" : "status-p sp-active";
    const expiryCopy =
      bannerExpiryDate && bannerStatus === "expired"
        ? `Expired on ${bannerExpiryDate}`
        : bannerExpiryDate
          ? `Active until ${bannerExpiryDate}`
          : "Your AI Sales Agent subscription is ready.";

    return (
      <div className="sub-banner">
        <div className="sb-icon">
          <FontAwesomeIcon icon={faCheck} />
        </div>
        <div className="sb-info">
          <strong>{bannerPlanName}</strong>
          <span>{expiryCopy}</span>
          {bannerFollowUpLimit > 0 && (
            <div className="sb-bar-wrap">
              <div className="sb-bar-label">
                {bannerFollowUpsUsed.toLocaleString("en-NG")} /{" "}
                {bannerFollowUpLimit.toLocaleString("en-NG")} follow-ups
              </div>
              <div className="sb-bar">
                <div
                  className={`sb-fill ${bannerProgressWidth >= 80 ? "warn" : ""}`}
                  style={{ width: `${bannerProgressWidth}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <span className={statusClass}>
          {bannerStatus === "expired" ? "Expired" : "Active"}
        </span>
      </div>
    );
  };

  const renderConnectCard = () => {
    if (!canShowSubscriptionState) {
      return null;
    }

    if (isConnected) {
      return (
        <div className="conn-card green">
          <div className="conn-ico green-bg">
            <FontAwesomeIcon icon={faWhatsapp} />
          </div>
          <div className="conn-body">
            <div className="conn-step green">All done — You&apos;re live!</div>
            <div className="conn-title">WhatsApp Number Connected</div>
            <div className="conn-desc">
              Your AI Sales Agent is live and responding to customers on your connected WhatsApp number.
            </div>
            <div className="conn-acts">
              <div className="num-badge">
                <div className="wa-dot" />
                {connectedPhoneNumber || "Connected number"}
              </div>
              <div className="connected-badge">
                <div className="wa-dot" />
                Connected
              </div>
              <button
                type="button"
                className="cbt cbt-o"
                onClick={launchSignup}
                disabled={connecting}
              >
                {connecting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    />
                    <span>Connecting...</span>
                  </>
                ) : (
                  "Reconnect WhatsApp"
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="conn-card">
        <div className="conn-ico">
          <FontAwesomeIcon icon={faWhatsapp} />
        </div>
        <div className="conn-body">
          <div className="conn-step">Step 3 — Action Required</div>
          <div className="conn-title">Connect Your WhatsApp Number</div>
          <div className="conn-desc">
            Your plan is active. Now link your WhatsApp Business number so Mycroshop AI can start responding to customers automatically.
          </div>
          <div className="conn-acts">
            <button
              type="button"
              className="cbt cbt-p"
              onClick={launchSignup}
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  />
                  <span>Connecting...</span>
                </>
              ) : (
                "Connect WhatsApp"
              )}
            </button>
            <button
              type="button"
              className="cbt cbt-o"
              onClick={() => setActiveModal("how-it-works")}
            >
              How it works
            </button>
          </div>
          {connectError ? <div className="inline-error">{connectError}</div> : null}
        </div>
      </div>
    );
  };

  const renderPlanGrid = () => {
    if (!token) {
      return (
        <div className="empty-state">
          <h3>Authentication Required</h3>
          <p>Please log in again to load your AI Sales Agent plans.</p>
        </div>
      );
    }

    if (whatsappPlansLoading && whatsappPlans.length === 0) {
      return (
        <div className="empty-state">
          <h3>Loading Plans...</h3>
          <p>Fetching the latest AI Sales Agent pricing for your account.</p>
        </div>
      );
    }

    if (whatsappPlansError && whatsappPlans.length === 0) {
      return (
        <div className="empty-state">
          <h3>Unable to Load Plans</h3>
          <p>
            {getErrorMessage(
              whatsappPlansError,
              "We couldn't load your AI Sales Agent plans right now."
            )}
          </p>
          <button type="button" className="pb pb-ghost empty-action" onClick={handleRefreshPlans}>
            Try Again
          </button>
        </div>
      );
    }

    if (whatsappPlans.length === 0) {
      return (
        <div className="empty-state">
          <h3>No Plans Available</h3>
          <p>There are no WhatsApp AI plans available for this account yet.</p>
        </div>
      );
    }

    return (
      <div className="plans-grid">
        {whatsappPlans.map((plan, index) => {
          const planFeatures = parsePlanFeatures(plan.features);
          const planIconPreset = resolvePlanIconPreset(plan, index);
          const planPriceAmount = resolvePlanAmount(plan);
          const buttonState = resolvePlanButtonState(plan, index);
          const currentPlanKey = String(plan.id || plan.slug || plan.name || "");
          const isCurrentPlanLoading =
            buttonState.isGetStarted && paymentLoadingPlanId === currentPlanKey;
          const isButtonDisabled =
            buttonState.disabled || (buttonState.isGetStarted && paymentLoading);

          return (
            <article
              key={plan.id || plan.slug || plan.name}
              className={`pc ${buttonState.cardClass}`}
            >
              {buttonState.badgeClass === "pop-b" ? (
                <div className="pop-b">Most Popular</div>
              ) : null}
              {buttonState.badgeClass === "curr-b" ? (
                <div className="curr-b">Active</div>
              ) : null}

              <div className={`pi ${planIconPreset.bgClass}`}>
                <FontAwesomeIcon icon={planIconPreset.icon} />
              </div>
              <div className="pn">{plan.name}</div>
              <div className="pf">{resolvePlanDescription(plan)}</div>

              <div className="pp">
                {planPriceAmount === null ? (
                  <span className="pp-c">Custom</span>
                ) : (
                  <>
                    <span className="pp-s">₦</span>
                    <span className="pp-a">
                      {planPriceAmount >= 1000
                        ? `${Math.round(planPriceAmount / 1000)}k`
                        : planPriceAmount.toLocaleString("en-NG")}
                    </span>
                  </>
                )}
              </div>
              <div className="pp-per">
                {planPriceAmount === null ? "Contact for pricing" : "per month"}
              </div>

              <div className="dv" />

              <div className="lims">
                <div className="lr">
                  <div className="lic">
                    <FontAwesomeIcon icon={faUsers} />
                  </div>
                  <span className="ll">Monthly customers</span>
                  <span className="lv">{formatPlanLimit(plan.max_customers)}</span>
                </div>
                <div className="lr">
                  <div className="lic">
                    <FontAwesomeIcon icon={faPhone} />
                  </div>
                  <span className="ll">WhatsApp numbers</span>
                  <span className="lv">{resolveWhatsappNumberLimit(plan)}</span>
                </div>
                <div className="lr">
                  <div className="lic">
                    <FontAwesomeIcon icon={faComments} />
                  </div>
                  <span className="ll">Follow-ups / month</span>
                  <span className="lv">{formatPlanLimit(plan.follow_up_limit)}</span>
                </div>
              </div>

              <ul className="feats">
                {planFeatures.map((feature, featureIndex) => (
                  <li key={`${plan.slug || plan.name}-${featureIndex}`}>
                    <span className="chk">
                      <FontAwesomeIcon icon={faCheck} />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {buttonState.note ? <div className="upgrade-note">⚠️ {buttonState.note}</div> : null}

              <button
                type="button"
                className={`pb ${buttonState.buttonClass}`}
                onClick={buttonState.onClick}
                disabled={isButtonDisabled}
              >
                {isCurrentPlanLoading ? "Please wait..." : buttonState.label}
              </button>
            </article>
          );
        })}
      </div>
    );
  };

  const renderSubscribeModal = () => {
    if (activeModal !== "subscribe" || !selectedPlan) {
      return null;
    }

    return (
      <div className="modal-bg show-sheet" role="presentation" onClick={resetAllModals}>
        <div className="modal shell" role="dialog" onClick={(event) => event.stopPropagation()}>
          <div className="sheet-handle" />
          <div className="m-ico">
            <FontAwesomeIcon icon={faCreditCard} />
          </div>
          <div className="m-h2">{`Subscribe to ${selectedPlan.name}`}</div>
          <div className="m-p">
            You&apos;ll be redirected to a secure Paystack checkout to complete payment.
          </div>

          <div className="bill-card">
            <div className="bill-hdr">
              <div className="bill-hdr-l">
                <div className="bill-ico">
                  <FontAwesomeIcon icon={faWandMagicSparkles} />
                </div>
                <div>
                  <div className="bill-title">Billing Period</div>
                  <div className="bill-sub">Choose how you want to pay for this plan.</div>
                </div>
              </div>
            </div>

            <div className="seg-outer">
              <div className="seg two-up">
                {BILLING_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`bs ${billingKey === option.key ? "on" : ""}`}
                    onClick={() => setBillingKey(option.key)}
                  >
                    <span className="bs-n">{option.label}</span>
                    <span className="bs-l">{option.shortLabel}</span>
                    <span className="bs-d">
                      {option.discount > 0 ? `${option.discount}% off` : "\u00A0"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bk">
            <div className="bk-row">
              <span>
                {formatCurrency(subscribeSummary.monthlyAmount, selectedPlan.price_display || "Custom")} ×{" "}
                {selectedBillingOption.months}{" "}
                {selectedBillingOption.months > 1 ? "months" : "month"}
              </span>
              <span>
                {formatCurrency(
                  subscribeSummary.subtotal,
                  selectedPlan.price_display || "Custom pricing"
                )}
              </span>
            </div>
            <div className="bk-row grn">
              <span>{selectedBillingOption.discount}% discount</span>
              <span>
                {subscribeSummary.discountAmount
                  ? `-${formatCurrency(subscribeSummary.discountAmount)}`
                  : formatCurrency(0)}
              </span>
            </div>
            <div className="bk-total">
              <span>Total</span>
              <span>
                {formatCurrency(
                  subscribeSummary.total,
                  selectedPlan.price_display || "Custom pricing"
                )}
              </span>
            </div>
          </div>

          <input
            id="subscribe-email"
            name="subscribe-email"
            className="m-input"
            type="email"
            value={subscriberEmail || ""}
            placeholder="Account email"
            readOnly
            autoComplete="email"
          />

          <div className="m-row">
            <button
              type="button"
              className="pb pb-ghost"
              onClick={resetAllModals}
              disabled={whatsappSubscribeLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="pb pb-primary"
              onClick={handleSubscribe}
              disabled={whatsappSubscribeLoading}
            >
              {whatsappSubscribeLoading ? "Processing..." : "Proceed to Payment"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderUpgradeModal = () => {
    if (activeModal !== "upgrade" || !upgradeTargetPlan) {
      return null;
    }

    console.log("Rendering upgrade modal", {
      upgradeTargetPlan,
      activePlan,
      activeModal,
      selectedMonths,
    });

    return (
      <div className="modal-bg show-sheet" role="presentation" onClick={resetAllModals}>
        <div className="modal shell" role="dialog" onClick={(event) => event.stopPropagation()}>
          <div className="sheet-handle" />
          <div className="m-ico">
            <FontAwesomeIcon icon={faArrowTrendUp} />
          </div>
          <div className="m-h2">{`Upgrade to ${upgradePreview.targetPlanName}`}</div>
          <div className="m-p">
            Choose how long you want to upgrade this plan for, then continue to Paystack to complete payment.
          </div>

          <div className="upgrade-box">
            <strong style={{ display: "block", marginBottom: "6px" }}>
              Current plan: {upgradePreview.currentPlanName}
            </strong>
            <span>
              Target plan: {upgradePreview.targetPlanName}
              {typeof upgradeMonthlyAmount === "number"
                ? ` · ${formatCurrency(upgradeMonthlyAmount)} per month`
                : ""}
            </span>
          </div>

          <div className="bill-card">
            <div className="bill-hdr">
              <div className="bill-hdr-l">
                <div className="bill-ico">
                  <FontAwesomeIcon icon={faCreditCard} />
                </div>
                <div>
                  <div className="bill-title">Upgrade Duration</div>
                  <div className="bill-sub">Pick the number of months for this upgrade.</div>
                </div>
              </div>
            </div>

            <div className="seg-outer">
              <div className="seg">
                {UPGRADE_MONTH_OPTIONS.map((months) => (
                  <button
                    key={months}
                    type="button"
                    className={`bs ${selectedMonths === months ? "on" : ""}`}
                    onClick={() => setSelectedMonths(months)}
                  >
                    <span className="bs-n">
                      {months} {months === 1 ? "month" : "months"}
                    </span>
                    <span className="bs-l">Upgrade period</span>
                    <span className="bs-d">
                      {typeof upgradeMonthlyAmount === "number"
                        ? formatCurrency(upgradeMonthlyAmount * months)
                        : "\u00A0"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bk">
            <div className="bk-row">
              <span style={{ color: "#111827", fontWeight: 700 }}>
                {upgradePreview.targetPlanName} · {selectedMonths}{" "}
                {selectedMonths === 1 ? "month" : "months"}
              </span>
              <span style={{ fontWeight: 700 }}>
                {formatCurrency(
                  upgradeTotalAmount,
                  upgradeTargetPlan?.price_display || "Custom pricing"
                )}
              </span>
            </div>
            <div className="bk-row muted-row">
              <span>
                {typeof upgradeMonthlyAmount === "number"
                  ? `${formatCurrency(upgradeMonthlyAmount)} × ${selectedMonths}`
                  : "Upgrade pricing will be confirmed at checkout."}
              </span>
              <span />
            </div>
            <div className="bk-total">
              <span>Total</span>
              <span>
                {formatCurrency(
                  upgradeTotalAmount,
                  upgradeTargetPlan?.price_display || "Custom pricing"
                )}
              </span>
            </div>
          </div>

          <div className="next-renewal-copy">
            Your plan limits update after payment is completed successfully.
          </div>

          <input
            id="upgrade-email"
            name="upgrade-email"
            className="m-input"
            type="email"
            value={subscriberEmail || ""}
            placeholder="Account email"
            readOnly
            autoComplete="email"
          />

          <div className="m-row">
            <button
              type="button"
              className="pb pb-ghost"
              onClick={resetAllModals}
              disabled={paymentLoading || whatsappSubscribeLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="pb pb-upgrade"
              onClick={handleUpgrade}
              disabled={paymentLoading || whatsappSubscribeLoading}
            >
              {paymentLoading || whatsappSubscribeLoading
                ? "Processing..."
                : "Confirm Upgrade"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEnterpriseModal = () => {
    if (activeModal !== "enterprise") {
      return null;
    }

    return (
      <div className="modal-bg show-sheet" role="presentation" onClick={resetAllModals}>
        <div className="modal shell" role="dialog" onClick={(event) => event.stopPropagation()}>
          <div className="sheet-handle" />
          <div className="m-ico">
            <FontAwesomeIcon icon={faBuilding} />
          </div>
          <div className="m-h2">Talk to our team</div>
          <div className="m-p">
            This plan is custom-quoted for your business. Reach our sales team and we&apos;ll build the right AI Sales Agent setup for you.
          </div>
          <div className="contact-b">
            <div className="cl">📧 Email</div>
            <a href={`mailto:${ENTERPRISE_EMAIL}`}>{ENTERPRISE_EMAIL}</a>
          </div>
          <div className="contact-b">
            <div className="cl">💬 WhatsApp</div>
            <a href={ENTERPRISE_WHATSAPP_LINK} target="_blank" rel="noreferrer">
              Chat with Sales →
            </a>
          </div>
          <button type="button" className="pb pb-ghost modal-close-button" onClick={resetAllModals}>
            Close
          </button>
        </div>
      </div>
    );
  };

  const renderHowItWorksModal = () => {
    if (activeModal !== "how-it-works") {
      return null;
    }

    return (
      <div className="modal-bg show-sheet" role="presentation" onClick={resetAllModals}>
        <div className="modal shell" role="dialog" onClick={(event) => event.stopPropagation()}>
          <div className="sheet-handle" />
          <div className="m-ico">
            <FontAwesomeIcon icon={faLightbulb} />
          </div>
          <div className="m-h2">How Connecting Works</div>
          <div className="m-p">
            Tapping <strong>Connect WhatsApp</strong> opens the Meta/WhatsApp Business signup flow. You&apos;ll log into Facebook, select your WhatsApp Business Account, and choose the phone number to connect.
          </div>

          <div className="how-steps">
            <div className="how-step-row">
              <div className="how-step-no">1</div>
              <div className="how-step-copy">
                <strong>Log in with Facebook</strong>
                <span>Use your business account</span>
              </div>
            </div>
            <div className="how-step-row">
              <div className="how-step-no">2</div>
              <div className="how-step-copy">
                <strong>Select your WABA</strong>
                <span>Create one if you don&apos;t have it yet</span>
              </div>
            </div>
            <div className="how-step-row">
              <div className="how-step-no">3</div>
              <div className="how-step-copy">
                <strong>Choose your phone number</strong>
                <span>Mycroshop AI takes it from there</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="pb pb-primary modal-primary-button"
            onClick={handleHowItWorksConfirm}
            disabled={connecting}
          >
            {connecting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                />
                <span>Connecting...</span>
              </>
            ) : (
              "Got it, Connect Now"
            )}
          </button>
          <button type="button" className="pb pb-ghost" onClick={resetAllModals}>
            Maybe Later
          </button>
        </div>
      </div>
    );
  };

  const renderModalLayer = () => (
    <>
      {renderSubscribeModal()}
      {renderUpgradeModal()}
      {renderEnterpriseModal()}
      {renderHowItWorksModal()}
    </>
  );

  return (
    <>
      <style>{`
        .sales-agent-guide {
          background: #f0f4fa;
          color: #111827;
          min-height: 100%;
        }

        .sales-agent-guide *, .sales-agent-guide *::before, .sales-agent-guide *::after {
          box-sizing: border-box;
        }

        .sales-agent-guide {
          --mc-blue: #0057ff;
          --mc-dark: #0044cc;
          --mc-darker: #002fa3;
          --mc-light: #d6e5ff;
          --mc-tint: #ebf1ff;
          --text-1: #111827;
          --text-2: #6b7280;
          --text-3: #9ca3af;
          --bg: #f0f4fa;
          --border: #e5e7eb;
          --r: 14px;
          --r-sm: 9px;
        }

        .sales-agent-guide .page-shell {
          min-height: 100%;
          background: var(--bg);
        }

        .sales-agent-guide .ui-hdr {
          background: linear-gradient(135deg, var(--mc-darker) 0%, var(--mc-dark) 55%, var(--mc-blue) 100%);
          padding: 42px 24px 76px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .sales-agent-guide .ui-hdr::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 80%, rgba(255,255,255,.07) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,.07) 0%, transparent 50%);
        }

        .sales-agent-guide .ui-hi {
          position: relative;
          z-index: 1;
          max-width: 760px;
          margin: 0 auto;
        }

        .sales-agent-guide .ui-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0 12px 16px 0;
          vertical-align: middle;
        }

        .sales-agent-guide .ui-logo img {
          display: block;
          width: 150px;
          max-width: 100%;
        }

        .sales-agent-guide .ui-badge-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          background: rgba(255,255,255,.14);
          border: 1px solid rgba(255,255,255,.24);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
          padding: 6px 12px;
          border-radius: 20px;
          margin: 0 0 16px;
          vertical-align: middle;
        }

        .sales-agent-guide .ui-h1 {
          font-size: clamp(26px, 3.3vw, 38px);
          font-weight: 900;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 10px;
        }

        .sales-agent-guide .ui-h1 em {
          font-style: normal;
          color: var(--mc-light);
        }

        .sales-agent-guide .ui-p {
          font-size: 13px;
          color: rgba(255,255,255,.78);
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .sales-agent-guide .steps-wrap {
          max-width: 640px;
          margin: -20px auto 0;
          padding: 0 20px;
          position: relative;
          z-index: 10;
        }

        .sales-agent-guide .steps-bar {
          background: #fff;
          border-radius: var(--r);
          box-shadow: 0 4px 16px rgba(0,0,0,.1);
          padding: 14px 20px;
          display: flex;
          align-items: center;
        }

        .sales-agent-guide .stp {
          display: flex;
          align-items: center;
          gap: 7px;
          flex: 1;
          min-width: 0;
        }

        .sales-agent-guide .stp-n {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 800;
          flex-shrink: 0;
          background: var(--mc-tint);
          color: var(--mc-dark);
          border: 2px solid var(--mc-light);
        }

        .sales-agent-guide .stp.done .stp-n,
        .sales-agent-guide .stp.active .stp-n {
          background: var(--mc-blue);
          color: #fff;
          border-color: var(--mc-blue);
        }

        .sales-agent-guide .stp.active .stp-n {
          box-shadow: 0 0 0 4px rgba(0,87,255,.14);
        }

        .sales-agent-guide .stp-l {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-2);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sales-agent-guide .stp.done .stp-l,
        .sales-agent-guide .stp.active .stp-l {
          color: var(--mc-dark);
        }

        .sales-agent-guide .stp-sep {
          width: 22px;
          height: 2px;
          background: var(--border);
          border-radius: 2px;
          margin: 0 4px;
          flex-shrink: 0;
        }

        .sales-agent-guide .stp-sep.done {
          background: var(--mc-blue);
        }

        .sales-agent-guide .mobile-steps {
          display: none;
        }

        .sales-agent-guide .content-shell {
          max-width: 1080px;
          margin: 32px auto 0;
          padding: 0 20px 40px;
        }

        .sales-agent-guide .section-stack {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .sales-agent-guide .section-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .sales-agent-guide .section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .7px;
          color: var(--mc-blue);
          margin-bottom: 6px;
        }

        .sales-agent-guide .section-head h2,
        .sales-agent-guide .upgrade-title {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: var(--text-1);
        }

        .sales-agent-guide .section-head p,
        .sales-agent-guide .upgrade-copy {
          margin: 8px 0 0;
          font-size: 13px;
          color: var(--text-2);
          line-height: 1.6;
        }

        .sales-agent-guide .refresh-btn {
          border: 1px solid var(--border);
          background: #fff;
          border-radius: 10px;
          padding: 10px 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-1);
          font-size: 13px;
          font-weight: 700;
        }

        .sales-agent-guide .refresh-btn:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .sales-agent-guide .toast {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          background: #0f4c1e;
          border: 1px solid #22c55e;
          color: #fff;
          padding: 12px 18px;
          border-radius: var(--r-sm);
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 8px 24px rgba(0,0,0,.2);
          align-self: flex-start;
        }

        .sales-agent-guide .toast-dot,
        .sales-agent-guide .wa-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .sales-agent-guide .sub-banner {
          background: #fff;
          border-radius: var(--r);
          box-shadow: 0 4px 16px rgba(0,0,0,.08);
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .sales-agent-guide .sb-icon {
          width: 40px;
          height: 40px;
          background: var(--mc-tint);
          border-radius: 50%;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          color: var(--mc-dark);
        }

        .sales-agent-guide .sb-info {
          flex: 1;
          min-width: 150px;
        }

        .sales-agent-guide .sb-info strong {
          display: block;
          font-size: 13px;
          font-weight: 700;
        }

        .sales-agent-guide .sb-info span {
          font-size: 11px;
          color: var(--text-2);
        }

        .sales-agent-guide .sb-bar-wrap {
          margin-top: 6px;
        }

        .sales-agent-guide .sb-bar-label {
          font-size: 10px;
          color: var(--text-2);
          margin-bottom: 4px;
        }

        .sales-agent-guide .sb-bar {
          height: 4px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .sales-agent-guide .sb-fill {
          height: 100%;
          background: var(--mc-blue);
          border-radius: 4px;
        }

        .sales-agent-guide .sb-fill.warn {
          background: #f59e0b;
        }

        .sales-agent-guide .status-p {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .5px;
          padding: 4px 11px;
          border-radius: 20px;
        }

        .sales-agent-guide .sp-active {
          background: var(--mc-tint);
          color: var(--mc-darker);
        }

        .sales-agent-guide .sp-expired {
          background: #fef2f2;
          color: #991b1b;
        }

        .sales-agent-guide .conn-card {
          background: #fff;
          border-radius: var(--r);
          border: 2px solid var(--mc-blue);
          box-shadow: 0 10px 36px rgba(0,87,255,.15);
          padding: 24px 20px;
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        .sales-agent-guide .conn-card.green {
          border-color: #22c55e;
          box-shadow: 0 10px 36px rgba(34,197,94,.12);
        }

        .sales-agent-guide .conn-ico {
          width: 52px;
          height: 52px;
          flex-shrink: 0;
          background: var(--mc-tint);
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 24px;
          color: var(--mc-blue);
        }

        .sales-agent-guide .conn-ico.green-bg {
          background: #ecfdf5;
          color: #16a34a;
        }

        .sales-agent-guide .conn-body {
          flex: 1;
        }

        .sales-agent-guide .conn-step {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .7px;
          color: var(--mc-blue);
          margin-bottom: 5px;
        }

        .sales-agent-guide .conn-step.green {
          color: #15803d;
        }

        .sales-agent-guide .conn-title {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .sales-agent-guide .conn-desc {
          font-size: 13px;
          color: var(--text-2);
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .sales-agent-guide .conn-acts {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
          align-items: center;
        }

        .sales-agent-guide .cbt {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: var(--r-sm);
          font-size: 12px;
          font-weight: 700;
          border: 2px solid transparent;
        }

        .sales-agent-guide .cbt:disabled {
          opacity: .7;
          cursor: not-allowed;
        }

        .sales-agent-guide .cbt-p {
          background: var(--mc-blue);
          color: #fff;
          box-shadow: 0 4px 12px rgba(0,87,255,.25);
        }

        .sales-agent-guide .cbt-o {
          background: transparent;
          color: var(--mc-dark);
          border-color: var(--mc-blue);
        }

        .sales-agent-guide .num-badge,
        .sales-agent-guide .connected-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 13px;
          border-radius: var(--r-sm);
          font-size: 12px;
          font-weight: 700;
          border: 1px solid #a7f3d0;
        }

        .sales-agent-guide .num-badge {
          background: #ecfdf5;
          color: #065f46;
        }

        .sales-agent-guide .connected-badge {
          background: #ecfdf5;
          color: #15803d;
        }

        .sales-agent-guide .inline-error {
          margin-top: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 12px;
          line-height: 1.5;
        }

        .sales-agent-guide .upgrade-head {
          text-align: center;
        }

        .sales-agent-guide .upgrade-head .section-title {
          color: var(--text-2);
        }

        .sales-agent-guide .plans-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .sales-agent-guide .pc {
          background: #fff;
          border-radius: var(--r);
          border: 2px solid var(--border);
          padding: 20px 16px 18px;
          display: flex;
          flex-direction: column;
          position: relative;
          min-height: 100%;
        }

        .sales-agent-guide .pc.pop {
          border-color: var(--mc-blue);
          box-shadow: 0 10px 36px rgba(0,87,255,.16);
          transform: translateY(-5px);
        }

        .sales-agent-guide .pc.curr {
          border-color: var(--mc-dark);
          background: linear-gradient(160deg, var(--mc-tint) 0%, #fff 70%);
        }

        .sales-agent-guide .pop-b {
          position: absolute;
          top: -11px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(90deg, var(--mc-darker), var(--mc-blue));
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .6px;
          text-transform: uppercase;
          padding: 3px 13px;
          border-radius: 20px;
          white-space: nowrap;
        }

        .sales-agent-guide .curr-b {
          position: absolute;
          top: 9px;
          right: 9px;
          background: var(--mc-tint);
          color: var(--mc-darker);
          font-size: 9px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 20px;
          border: 1px solid var(--mc-light);
        }

        .sales-agent-guide .pi {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          font-size: 18px;
          margin-bottom: 10px;
        }

        .sales-agent-guide .ic1 { background: #eff6ff; color: #0057ff; }
        .sales-agent-guide .ic2 { background: var(--mc-tint); color: #0044cc; }
        .sales-agent-guide .ic3 { background: #fdf4ff; color: #7c3aed; }
        .sales-agent-guide .ic4 { background: #fff7ed; color: #c2410c; }

        .sales-agent-guide .pn {
          font-size: 15px;
          font-weight: 800;
          margin-bottom: 2px;
        }

        .sales-agent-guide .pf {
          font-size: 11px;
          color: var(--text-2);
          margin-bottom: 12px;
          min-height: 28px;
          line-height: 1.5;
        }

        .sales-agent-guide .pp {
          display: flex;
          align-items: baseline;
          gap: 2px;
          margin-bottom: 2px;
        }

        .sales-agent-guide .pp-s {
          font-size: 14px;
          font-weight: 700;
        }

        .sales-agent-guide .pp-a {
          font-size: 28px;
          font-weight: 900;
          line-height: 1;
        }

        .sales-agent-guide .pp-c {
          font-size: 22px;
          font-weight: 900;
        }

        .sales-agent-guide .pp-per {
          font-size: 10px;
          color: var(--text-3);
          margin-bottom: 8px;
        }

        .sales-agent-guide .dv {
          height: 1px;
          background: var(--border);
          margin: 12px 0;
        }

        .sales-agent-guide .lims {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }

        .sales-agent-guide .lr {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
        }

        .sales-agent-guide .lic {
          width: 22px;
          height: 22px;
          background: #f9fafb;
          border-radius: 6px;
          display: grid;
          place-items: center;
          font-size: 10px;
          flex-shrink: 0;
        }

        .sales-agent-guide .ll {
          color: var(--text-2);
          flex: 1;
        }

        .sales-agent-guide .lv {
          font-weight: 700;
        }

        .sales-agent-guide .feats {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-bottom: 16px;
          padding: 0;
          flex: 1;
        }

        .sales-agent-guide .feats li {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 11px;
          color: var(--text-2);
          line-height: 1.4;
        }

        .sales-agent-guide .chk {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          margin-top: 1px;
          background: var(--mc-tint);
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 7px;
          color: var(--mc-dark);
        }

        .sales-agent-guide .upgrade-note {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: var(--r-sm);
          padding: 10px 14px;
          font-size: 11px;
          color: #92400e;
          margin-bottom: 10px;
          display: flex;
          gap: 7px;
          align-items: flex-start;
        }

        .sales-agent-guide .pb {
          display: block;
          width: 100%;
          padding: 10px;
          border-radius: var(--r-sm);
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          border: 2px solid transparent;
          margin-top: auto;
        }

        .sales-agent-guide .pb:disabled {
          cursor: not-allowed;
        }

        .sales-agent-guide .pb-primary {
          background: linear-gradient(135deg, var(--mc-dark), var(--mc-blue));
          color: #fff;
          box-shadow: 0 4px 12px rgba(0,87,255,.25);
        }

        .sales-agent-guide .pb-outline {
          background: transparent;
          color: var(--mc-dark);
          border-color: var(--mc-blue);
        }

        .sales-agent-guide .pb-dark {
          background: linear-gradient(135deg, #1e293b, #374151);
          color: #fff;
        }

        .sales-agent-guide .pb-disabled {
          background: #f3f4f6;
          color: var(--text-3);
          border-color: transparent;
        }

        .sales-agent-guide .pb-upgrade {
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: #fff;
          box-shadow: 0 4px 12px rgba(124,58,237,.25);
        }

        .sales-agent-guide .pb-down {
          background: #f3f4f6;
          color: var(--text-3);
          border-color: var(--border);
          font-size: 10px;
        }

        .sales-agent-guide .pb-ghost {
          background: #f3f4f6;
          color: var(--text-2);
          border-color: transparent;
        }

        .sales-agent-guide .empty-state {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: var(--r);
          padding: 26px;
          text-align: center;
          box-shadow: 0 4px 16px rgba(0,0,0,.06);
        }

        .sales-agent-guide .empty-state h3 {
          margin: 0 0 8px;
          font-size: 20px;
          font-weight: 800;
        }

        .sales-agent-guide .empty-state p {
          margin: 0 auto 14px;
          max-width: 500px;
          color: var(--text-2);
          font-size: 13px;
          line-height: 1.6;
        }

        .sales-agent-guide .empty-action {
          max-width: 220px;
          margin-left: auto;
          margin-right: auto;
        }

        .sales-agent-guide .modal-bg {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.55);
          display: grid;
          place-items: center;
          padding: 20px;
          z-index: 9999;
        }

        .sales-agent-guide .modal {
          background: #fff;
          border-radius: var(--r);
          display: block;
          position: relative;
          inset: auto;
          height: auto;
          padding: 26px;
          max-width: 420px;
          width: 100%;
          max-height: 90vh;
          overflow-x: hidden;
          overflow-y: auto;
          outline: none;
          box-shadow: 0 24px 64px rgba(0,0,0,.18);
        }

        .sales-agent-guide .sheet-handle {
          display: none;
        }

        .sales-agent-guide .m-ico {
          width: 46px;
          height: 46px;
          background: var(--mc-tint);
          border-radius: 12px;
          display: grid;
          place-items: center;
          font-size: 22px;
          margin-bottom: 14px;
          color: var(--mc-dark);
        }

        .sales-agent-guide .m-h2 {
          font-size: 17px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .sales-agent-guide .m-p {
          font-size: 12px;
          color: var(--text-2);
          line-height: 1.6;
          margin-bottom: 14px;
        }

        .sales-agent-guide .bill-card {
          background: #fff;
          border-radius: var(--r);
          border: 1px solid var(--border);
          box-shadow: 0 1px 4px rgba(0,0,0,.06);
          padding: 16px 18px 14px;
          margin-bottom: 14px;
        }

        .sales-agent-guide .bill-hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .sales-agent-guide .bill-hdr-l {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sales-agent-guide .bill-ico {
          width: 28px;
          height: 28px;
          background: var(--mc-tint);
          border-radius: 7px;
          display: grid;
          place-items: center;
          font-size: 13px;
          color: var(--mc-dark);
        }

        .sales-agent-guide .bill-title {
          font-size: 13px;
          font-weight: 800;
        }

        .sales-agent-guide .bill-sub {
          font-size: 11px;
          color: var(--text-2);
        }

        .sales-agent-guide .seg-outer {
          overflow-x: auto;
          scrollbar-width: none;
        }

        .sales-agent-guide .seg-outer::-webkit-scrollbar {
          display: none;
        }

        .sales-agent-guide .seg {
          display: flex;
          background: var(--bg);
          border-radius: 8px;
          padding: 3px;
          min-width: 100%;
        }

        .sales-agent-guide .seg.two-up {
          gap: 4px;
        }

        .sales-agent-guide .bs {
          flex: 1;
          min-width: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 7px 8px;
          border-radius: 6px;
          border: none;
          background: transparent;
          font-family: inherit;
        }

        .sales-agent-guide .bs.on {
          background: #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,.1), 0 0 0 1.5px var(--mc-blue);
        }

        .sales-agent-guide .bs-n {
          font-size: 13px;
          font-weight: 900;
          color: var(--text-3);
          line-height: 1.1;
        }

        .sales-agent-guide .bs.on .bs-n {
          color: var(--mc-blue);
        }

        .sales-agent-guide .bs-l {
          font-size: 9px;
          font-weight: 600;
          color: var(--text-3);
        }

        .sales-agent-guide .bs.on .bs-l {
          color: var(--mc-dark);
        }

        .sales-agent-guide .bs-d {
          font-size: 8px;
          font-weight: 800;
          color: #15803d;
          margin-top: 2px;
          white-space: nowrap;
          min-height: 11px;
        }

        .sales-agent-guide .bk {
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: var(--r-sm);
          padding: 11px 13px;
          margin-bottom: 13px;
          font-size: 12px;
        }

        .sales-agent-guide .bk-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 4px;
          color: var(--text-2);
        }

        .sales-agent-guide .bk-row.grn {
          color: #16a34a;
          font-weight: 700;
        }

        .sales-agent-guide .bk-row.muted-row {
          color: var(--text-3);
          font-size: 11px;
        }

        .sales-agent-guide .bk-total {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          border-top: 1px solid var(--border);
          padding-top: 7px;
          margin-top: 3px;
          font-weight: 800;
        }

        .sales-agent-guide .bk-total span:last-child {
          color: var(--mc-dark);
        }

        .sales-agent-guide .m-input {
          width: 100%;
          padding: 10px 12px;
          border: 1.5px solid var(--mc-blue);
          border-radius: var(--r-sm);
          font-size: 12px;
          margin-bottom: 13px;
          font-family: inherit;
          color: var(--text-1);
          outline: none;
        }

        .sales-agent-guide .m-row {
          display: flex;
          gap: 9px;
        }

        .sales-agent-guide .m-row .pb {
          flex: 1;
        }

        .sales-agent-guide .upgrade-box {
          background: var(--mc-tint);
          border: 1px solid var(--mc-light);
          border-radius: var(--r-sm);
          padding: 10px 13px;
          font-size: 11px;
          color: var(--mc-darker);
          margin-bottom: 13px;
          line-height: 1.5;
        }

        .sales-agent-guide .next-renewal-copy {
          font-size: 11px;
          color: var(--text-2);
          margin-bottom: 12px;
        }

        .sales-agent-guide .contact-b {
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: var(--r-sm);
          padding: 11px 13px;
          margin-bottom: 10px;
        }

        .sales-agent-guide .contact-b .cl {
          font-size: 10px;
          color: var(--text-3);
          margin-bottom: 3px;
        }

        .sales-agent-guide .contact-b a {
          font-size: 13px;
          font-weight: 700;
          color: var(--mc-dark);
          text-decoration: none;
        }

        .sales-agent-guide .how-steps {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-bottom: 18px;
        }

        .sales-agent-guide .how-step-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 13px;
          background: var(--bg);
          border-radius: 9px;
        }

        .sales-agent-guide .how-step-no {
          width: 26px;
          height: 26px;
          background: var(--mc-blue);
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .sales-agent-guide .how-step-copy {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 12px;
        }

        .sales-agent-guide .how-step-copy strong {
          color: var(--text-1);
        }

        .sales-agent-guide .how-step-copy span {
          color: var(--text-2);
          font-size: 11px;
          line-height: 1.5;
        }

        .sales-agent-guide .modal-primary-button,
        .sales-agent-guide .modal-close-button {
          margin-bottom: 8px;
        }

        @media (max-width: 1100px) {
          .sales-agent-guide .plans-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 767px) {
          .sales-agent-guide .ui-hdr {
            padding: 50px 16px 58px;
          }

          .sales-agent-guide .ui-logo img {
            width: 136px;
          }

          .sales-agent-guide .ui-badge-pill {
            font-size: 9px;
            padding: 5px 10px;
          }

          .sales-agent-guide .ui-h1 {
            font-size: 20px;
          }

          .sales-agent-guide .ui-p {
            font-size: 11px;
            max-width: 260px;
          }

          .sales-agent-guide .steps-wrap {
            padding: 0 12px;
            margin-top: -16px;
          }

          .sales-agent-guide .steps-bar {
            padding: 11px 14px;
          }

          .sales-agent-guide .desktop-steps {
            display: none;
          }

          .sales-agent-guide .mobile-steps {
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 100%;
          }

          .sales-agent-guide .mobile-steps-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }

          .sales-agent-guide .mobile-steps-label {
            text-align: center;
            font-size: 12px;
            font-weight: 700;
            color: var(--text-1);
          }

          .sales-agent-guide .stp.mobile-only {
            flex: none;
          }

          .sales-agent-guide .content-shell {
            padding: 0 12px 28px;
          }

          .sales-agent-guide .section-head h2,
          .sales-agent-guide .upgrade-title {
            font-size: 18px;
          }

          .sales-agent-guide .section-head p,
          .sales-agent-guide .upgrade-copy {
            font-size: 12px;
          }

          .sales-agent-guide .refresh-btn {
            width: 100%;
            justify-content: center;
          }

          .sales-agent-guide .toast {
            width: 100%;
            align-self: stretch;
            font-size: 11px;
            padding: 10px 12px;
          }

          .sales-agent-guide .sub-banner {
            gap: 10px;
            padding: 12px;
          }

          .sales-agent-guide .sb-icon {
            width: 36px;
            height: 36px;
          }

          .sales-agent-guide .sb-info strong {
            font-size: 12px;
          }

          .sales-agent-guide .sb-info span,
          .sales-agent-guide .sb-bar-label {
            font-size: 10px;
          }

          .sales-agent-guide .conn-card {
            flex-direction: column;
            gap: 14px;
          }

          .sales-agent-guide .conn-acts {
            flex-direction: column;
            align-items: stretch;
          }

          .sales-agent-guide .cbt,
          .sales-agent-guide .pb,
          .sales-agent-guide .refresh-btn {
            width: 100%;
          }

          .sales-agent-guide .plans-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 9px;
          }

          .sales-agent-guide .pc {
            padding: 14px 11px 12px;
          }

          .sales-agent-guide .pc.pop {
            transform: translateY(-3px);
          }

          .sales-agent-guide .pi {
            width: 32px;
            height: 32px;
            font-size: 15px;
            margin-bottom: 8px;
          }

          .sales-agent-guide .pn {
            font-size: 13px;
          }

          .sales-agent-guide .pf {
            font-size: 10px;
            min-height: 32px;
          }

          .sales-agent-guide .pp-a {
            font-size: 22px;
          }

          .sales-agent-guide .pp-s {
            font-size: 12px;
          }

          .sales-agent-guide .pp-c {
            font-size: 17px;
          }

          .sales-agent-guide .pp-per {
            font-size: 9px;
          }

          .sales-agent-guide .feats li,
          .sales-agent-guide .lr,
          .sales-agent-guide .upgrade-note {
            font-size: 10px;
          }

          .sales-agent-guide .pb {
            font-size: 10px;
            padding: 7px;
          }

          .sales-agent-guide .pb-down {
            font-size: 9px;
          }

          .sales-agent-guide .modal-bg.show-sheet {
            align-items: flex-end;
            padding: 0;
          }

          .sales-agent-guide .modal.shell {
            max-width: 100%;
            border-radius: 18px 18px 0 0;
            padding: 20px 18px;
            max-height: 90vh;
            overflow-y: auto;
          }

          .sales-agent-guide .sheet-handle {
            display: block;
            width: 36px;
            height: 4px;
            background: #e5e7eb;
            border-radius: 4px;
            margin: 0 auto 16px;
          }

          .sales-agent-guide .m-ico {
            width: 40px;
            height: 40px;
            font-size: 19px;
          }

          .sales-agent-guide .m-h2 {
            font-size: 16px;
          }

          .sales-agent-guide .m-p,
          .sales-agent-guide .m-input,
          .sales-agent-guide .bk,
          .sales-agent-guide .how-step-copy {
            font-size: 11px;
          }

          .sales-agent-guide .m-row {
            flex-direction: column;
          }

          .sales-agent-guide .bs {
            min-width: 98px;
          }
        }
      `}</style>

      <div className="sales-agent-guide">
        <div className="page-shell">
          <div className="ui-hdr">
            <div className="ui-hi">
              <div className="ui-logo">
                <img src={Logo} alt="Mycroshop"/>
              </div>
              <div className="ui-badge-pill">
                <FontAwesomeIcon icon={faWandMagicSparkles} />
                <span>AI Sales Agent</span>
              </div>
              <div className="ui-h1">
                Automate Sales on <em>WhatsApp</em>
                <br />
                with Mycroshop AI
              </div>
              <div className="ui-p">
                Your AI-powered assistant handles customer follow-ups, order updates, and conversations 24/7. Pick the plan that fits your volume.
              </div>
            </div>
          </div>

          <div className="steps-wrap">
            <div className="steps-bar">
              <div className="desktop-steps" style={{ display: "flex", width: "100%", alignItems: "center" }}>
                {[
                  { label: "Choose Plan", done: activeStep > 1 || screenState !== "default", active: activeStep === 1 },
                  { label: "Pay Securely", done: screenState !== "default", active: false },
                  { label: "Connect WhatsApp", done: isConnected, active: screenState === "post-payment" },
                ].map((step, index) => (
                  <React.Fragment key={step.label}>
                    <div className={`stp ${step.done ? "done" : ""} ${step.active ? "active" : ""}`}>
                      <div className="stp-n">
                        {step.done ? <FontAwesomeIcon icon={faCheck} /> : index + 1}
                      </div>
                      <div className="stp-l">{step.label}</div>
                    </div>
                    {index < 2 ? (
                      <div className={`stp-sep ${step.done ? "done" : ""}`} />
                    ) : null}
                  </React.Fragment>
                ))}
              </div>

              <div className="mobile-steps">
                <div className="mobile-steps-row">
                  {[1, 2, 3].map((stepNumber, index) => {
                    const isDone =
                      (stepNumber === 1 && screenState !== "default") ||
                      (stepNumber === 2 && screenState !== "default") ||
                      (stepNumber === 3 && isConnected);
                    const isActive =
                      (stepNumber === 1 && screenState === "default") ||
                      (stepNumber === 3 && screenState === "post-payment");

                    return (
                      <React.Fragment key={stepNumber}>
                        <div className={`stp mobile-only ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                          <div className="stp-n">
                            {isDone ? <FontAwesomeIcon icon={faCheck} /> : stepNumber}
                          </div>
                        </div>
                        {index < 2 ? (
                          <div className={`stp-sep ${isDone ? "done" : ""}`} />
                        ) : null}
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="mobile-steps-label">
                  {screenState === "connected"
                    ? "All steps complete"
                    : screenState === "post-payment"
                      ? "Step 3 — Connect WhatsApp"
                      : "Step 1 — Choose a Plan"}
                </div>
              </div>
            </div>
          </div>

          <div className="content-shell">
            <div className="section-stack">
              {paymentNotice ? (
                <div className="toast">
                  <div className="toast-dot" />
                  <span>{paymentNotice}</span>
                </div>
              ) : null}

              {screenState === "default" ? (
                <div className="section-head">
                  <div>
                    <div className="section-title">Pricing</div>
                    <h2>Choose the Plan That Fits Your Business</h2>
                    <p>Start with the right AI Sales Agent capacity for your customer volume and WhatsApp activity.</p>
                  </div>
                  <button
                    type="button"
                    className="refresh-btn"
                    onClick={handleRefreshPlans}
                    disabled={!token || whatsappPlansLoading}
                  >
                    <FontAwesomeIcon icon={faRotateRight} />
                    <span>{whatsappPlansLoading ? "Refreshing..." : "Refresh Plans"}</span>
                  </button>
                </div>
              ) : null}

              {renderSubscriptionBanner()}
              {renderConnectCard()}

              {screenState !== "default" ? (
                <div className="upgrade-head">
                  <div className="section-title">Your Subscription</div>
                  <div className="upgrade-title">Upgrade Anytime</div>
                  <div className="upgrade-copy">Switch to a larger plan whenever your customer volume grows.</div>
                </div>
              ) : null}

              {renderPlanGrid()}
            </div>
          </div>
        </div>

        {renderModalLayer()}
      </div>
    </>
  );
};

export default SalesAgent;
