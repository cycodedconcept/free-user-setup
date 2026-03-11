import React, { useMemo, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import styles from "../../styles.module.css";
import Button from "../../components/ui/Button";

const SHOW_BOOKING_KEY = "mycroshop.showBookingConfirmation";
const PENDING_BOOKING_KEY = "mycroshop.pendingBooking";
const PAYMENT_REFERENCE_KEY = "mycroshop.paymentReference";
const PAYMENT_CONTEXT_KEY = "mycroshop.paymentContext";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reference = useMemo(() => {
    return searchParams.get("reference") || searchParams.get("trxref") || "";
  }, [searchParams]);

  useEffect(() => {
    if (!reference) return;
    try {
      localStorage.setItem(PAYMENT_REFERENCE_KEY, reference);
    } catch (error) {
      // Ignore storage errors (private mode, disabled storage, etc.)
    }
  }, [reference]);

  const isBookingPayment = useMemo(() => {
    try {
      const paymentContext =
        sessionStorage.getItem(PAYMENT_CONTEXT_KEY) ||
        localStorage.getItem(PAYMENT_CONTEXT_KEY) ||
        "";

      if (paymentContext) {
        return paymentContext === "booking";
      }

      return Boolean(
        sessionStorage.getItem(PENDING_BOOKING_KEY) || localStorage.getItem(PENDING_BOOKING_KEY)
      );
    } catch (error) {
      return false;
    }
  }, []);

  const handleContinue = useCallback(() => {
    try {
      localStorage.removeItem(PAYMENT_CONTEXT_KEY);
      sessionStorage.removeItem(PAYMENT_CONTEXT_KEY);

      if (isBookingPayment) {
        localStorage.setItem(SHOW_BOOKING_KEY, "true");
        sessionStorage.setItem(SHOW_BOOKING_KEY, "true");
      }
    } catch (error) {
      // Ignore storage errors
    }
    navigate(isBookingPayment ? "/customer?showBooking=1" : "/customer");
  }, [isBookingPayment, navigate]);

  return (
    <div className={styles.paymentCallbackPage}>
      <div className={styles.paymentCallbackCard}>
        <div className={styles.paymentCallbackIcon} aria-hidden="true">
          <svg viewBox="0 0 72 72" width="72" height="72" fill="none" stroke="currentColor">
            <circle cx="36" cy="36" r="27" strokeWidth="6" />
            <path
              d="M24 37l8 8 16-18"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className={styles.paymentCallbackTitle}>
          {isBookingPayment ? "Booking Confirmed!" : "Order Confirmed!"}
        </h1>
        <p className={styles.paymentCallbackText}>
          {isBookingPayment
            ? "Thank you for your purchase. Your booking is being processed."
            : "Thank you for your purchase. Your order is being processed."}
        </p>
        <Button
          className={styles.paymentCallbackButton}
          type="button"
          onClick={handleContinue}
          unstyled
        >
          Continue Shopping
        </Button>
      </div>
    </div>
  );
};

export default PaymentCallback;
