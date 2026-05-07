import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { getAccessToken } from "../slice/whatsappPlanSlice";
import { readWhatsappPlanPaymentContext } from "../vendors/pages/settings/whatsappPlanPayment";

const pageStyles = {
  minHeight: "100vh",
  padding: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "radial-gradient(circle at top, rgba(2, 115, 249, 0.14), transparent 34%), linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)",
};

const cardStyles = {
  width: "min(420px, 100%)",
  background: "#ffffff",
  border: "1px solid #dbeafe",
  borderRadius: "28px",
  boxShadow: "0 28px 60px rgba(15, 23, 42, 0.12)",
  padding: "40px 32px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "18px",
  textAlign: "center",
};

const iconWrapperStyles = {
  width: "88px",
  height: "88px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const messageStyles = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 700,
  color: "#111827",
  textTransform: "capitalize",
};

const WhatsAppConnectSuccess = () => {
  const dispatch = useDispatch();
  const initializationRef = useRef(false);
  const paymentContext = useMemo(() => readWhatsappPlanPaymentContext(), []);
  const [cardState, setCardState] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (initializationRef.current) {
      return;
    }

    initializationRef.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const state = urlParams.get("state") || "";
    const code = urlParams.get("code") || "";

    const token = localStorage.getItem("token") || paymentContext?.token || "";

    if (!state || !token || !code) {
      setCardState("error");
      setErrorMessage("Unable to complete the WhatsApp connection.");
      return;
    }

    const fetchAccessToken = async () => {
      try {
        const response = await dispatch(getAccessToken({ token, state, code })).unwrap();
        console.log("getAccessToken response:", response);
        setCardState("success");
      } catch (error) {
        console.error("getAccessToken error:", error);
        setCardState("error");
        setErrorMessage(
          error?.message ||
            error?.error ||
            error?.data?.message ||
            "Unable to complete the WhatsApp connection."
        );
      }
    };

    void fetchAccessToken();
  }, [dispatch, paymentContext?.token]);

  const isError = cardState === "error";
  const isLoading = cardState === "loading";
  const cardMessage = isLoading
    ? "Completing connection..."
    : isError
      ? "Connection failed"
      : "Connection successful";
  const iconStyle = {
    ...iconWrapperStyles,
    color: isError ? "#dc2626" : "#16a34a",
    background: isError ? "rgba(220, 38, 38, 0.1)" : "rgba(22, 163, 74, 0.1)",
  };

  return (
    <div style={pageStyles}>
      <div style={cardStyles}>
        <div style={iconStyle} aria-hidden="true">
          {isLoading ? (
            <span className="spinner-border" role="status" aria-hidden="true" />
          ) : isError ? (
            <svg viewBox="0 0 72 72" width="72" height="72" fill="none" stroke="currentColor">
              <circle cx="36" cy="36" r="27" strokeWidth="6" />
              <path
                d="M28 28l16 16M44 28L28 44"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </svg>
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

        <p style={messageStyles}>{cardMessage}</p>
        {isError && errorMessage ? (
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              lineHeight: 1.6,
              color: "#6b7280",
            }}
          >
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default WhatsAppConnectSuccess;
