import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import { API_URL } from "../../../config/constant";
import styles from "../../../styles.module.css";
import { connectWhatsappAccount } from "../../../slice/whatsappPlanSlice";
import {
  clearWhatsappOauthSession,
  clearWhatsappPlanPaymentContext,
  readWhatsappPlanPaymentContext,
  writeWhatsappOauthSession,
} from "./whatsappPlanPayment";

const WHATSAPP_POST_CONNECTION_ROUTE = "/vendor/store";
const CALLBACK_LOADING_MESSAGE = "Connecting your WhatsApp account...";

const statusBoxBaseStyle = {
  width: "100%",
  borderRadius: "16px",
  padding: "14px 16px",
  fontSize: "14px",
  lineHeight: 1.6,
  textAlign: "left",
};

const resolveErrorMessage = (error, fallbackMessage) => {
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

const readJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const WhatsappLinkPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { connectLoading } = useSelector((state) => state.whatsappPlan);
  const paymentContext = useMemo(() => readWhatsappPlanPaymentContext(), []);
  const initializationRef = useRef(false);
  const redirectTimeoutRef = useRef(null);
  const [pageError, setPageError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [callbackLoading, setCallbackLoading] = useState(false);
  const [callbackSuccess, setCallbackSuccess] = useState(false);
  const [connectStartError, setConnectStartError] = useState("");

  const paymentReference =
    searchParams.get("reference") ||
    searchParams.get("trxref") ||
    paymentContext?.reference ||
    "";

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const handleStartWhatsappConnection = useCallback(async () => {
    if (connectLoading) {
      return;
    }

    setConnectStartError("");
    const authToken = localStorage.getItem("token") || paymentContext?.token || "";

    if (!authToken) {
      setConnectStartError("Please log in again before connecting WhatsApp.");
      return;
    }

    try {
      const response = await dispatch(connectWhatsappAccount({ token: authToken })).unwrap();
      console.log("connectWhatsappAccount response:", response);
      const authUrl = response?.data?.authUrl || response?.authUrl || "";
      const nextState = response?.data?.state || response?.state || "";

      if (!authUrl) {
        throw new Error("Missing WhatsApp authorization URL.");
      }

      if (!nextState) {
        throw new Error("Missing WhatsApp session state.");
      }

      writeWhatsappOauthSession({ authUrl, state: nextState });
      window.location.assign(authUrl);
    } catch (error) {
      setConnectStartError(
        resolveErrorMessage(
          error,
          "Failed to initiate WhatsApp connection. Please try again."
        )
      );
    }
  }, [connectLoading, dispatch, paymentContext?.token]);

  const handleOauthCallback = useCallback(async ({ code, state }) => {
    const storedState = localStorage.getItem("whatsapp_oauth_state");

    if (!state || state !== storedState) {
      setPageError("Invalid or expired connection session.");
      setStatusMessage("");
      return;
    }

    setCallbackLoading(true);
    setCallbackSuccess(false);
    setPageError("");
    setStatusMessage("");

    try {
      const params = new URLSearchParams({ state, code });
      const response = await fetch(
        `${API_URL}/meta-connection/whatsapp/callback?${params.toString()}`,
        { method: "GET" }
      );
      const result = await readJsonSafely(response);

      if (!response.ok || result?.success === false) {
        throw new Error(
          resolveErrorMessage(
            result,
            response.statusText || "Unable to connect WhatsApp right now."
          )
        );
      }

      setCallbackSuccess(true);
      setStatusMessage("WhatsApp connected successfully.");
      window.history.replaceState({}, document.title, window.location.pathname);
      clearWhatsappPlanPaymentContext();

      redirectTimeoutRef.current = window.setTimeout(() => {
        navigate(WHATSAPP_POST_CONNECTION_ROUTE, { replace: true });
      }, 1400);
    } catch (callbackError) {
      setPageError(
        resolveErrorMessage(
          callbackError,
          "Something went wrong while completing your WhatsApp connection."
        )
      );
    } finally {
      clearWhatsappOauthSession();
      setCallbackLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (initializationRef.current) {
      return;
    }

    initializationRef.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const hasCode = Boolean(code);
    const hasState = Boolean(state);

    if (hasCode || hasState) {
      if (!hasCode || !hasState) {
        setPageError("Invalid redirect from Facebook. Please try again.");
        setStatusMessage("");
        return;
      }

      void handleOauthCallback({ code, state });
      return;
    }
  }, [handleOauthCallback]);

  const title = callbackLoading
    ? CALLBACK_LOADING_MESSAGE
    : callbackSuccess
      ? "WhatsApp Connected"
      : "Payment Successful";

  const description = callbackLoading
    ? "Please wait while we complete your WhatsApp connection."
    : callbackSuccess
      ? "WhatsApp connected successfully."
      : paymentContext?.planName
        ? `Your ${paymentContext.planName} WhatsApp plan is ready.`
        : "Your WhatsApp plan payment is complete.";

  return (
    <div className={styles.vendorWhatsappLinkPage}>
      <div className={styles.vendorWhatsappLinkCard}>
        <div className={styles.vendorWhatsappLinkIcon} aria-hidden="true">
          {callbackLoading ? (
            <span className="spinner-border text-primary" role="status" aria-hidden="true" />
          ) : (
            <svg viewBox="0 0 72 72" width="72" height="72" fill="none" stroke="currentColor">
              <circle cx="36" cy="36" r="27" strokeWidth="6" />
              <path
                d="M24 37l8 8 16-18"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        <h1 className={styles.vendorWhatsappLinkTitle}>{title}</h1>
        <p className={styles.vendorWhatsappLinkText}>{description}</p>

        <div className={styles.vendorWhatsappLinkSummary}>
          <div className={styles.vendorWhatsappLinkSummaryItem}>
            <span>Plan</span>
            <strong>{paymentContext?.planName || "Selected WhatsApp plan"}</strong>
          </div>
          <div className={styles.vendorWhatsappLinkSummaryItem}>
            <span>Email</span>
            <strong>{paymentContext?.email || "Account email"}</strong>
          </div>
          {paymentReference && (
            <div className={styles.vendorWhatsappLinkSummaryItem}>
              <span>Reference</span>
              <strong>{paymentReference}</strong>
            </div>
          )}
        </div>

        {statusMessage ? (
          <div
            style={{
              ...statusBoxBaseStyle,
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              color: "#1d4ed8",
            }}
          >
            {statusMessage}
          </div>
        ) : null}

        {pageError ? (
          <div
            style={{
              ...statusBoxBaseStyle,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
            }}
          >
            {pageError}
          </div>
        ) : null}

        {callbackLoading || callbackSuccess ? null : (
          <>
            <Button
              type="button"
              className={styles.vendorWhatsappLinkButton}
              onClick={handleStartWhatsappConnection}
              disabled={connectLoading}
              unstyled
            >
              {connectLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                    style={{ marginRight: "10px" }}
                  />
                  Connecting...
                </>
              ) : (
                "Connect WhatsApp"
              )}
            </Button>

            {connectStartError ? (
              <div
                style={{
                  ...statusBoxBaseStyle,
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  color: "#b91c1c",
                }}
              >
                {connectStartError}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default WhatsappLinkPage;
