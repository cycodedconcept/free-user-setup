import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles.module.css";
import productImage from "../../assets/bp.png";
import Button from "../../components/ui/Button";

const Checkout = () => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("16");
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const sizes = ["8", "16", "18"];

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
          <h1 className={styles.customerCheckoutTitle}>Awesome Store</h1>
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
            <span className={styles.customerCheckoutCartBadge}>0</span>
          </Button>
        </header>

        {!showOrderSummary ? (
          <>
            <div className={styles.customerCheckoutCartMeta}>
              <div className={styles.customerCheckoutCartTitle}>
                <span>Your Cart</span>
                <span className={styles.customerCheckoutCartDivider}>|</span>
                <span>1 Item</span>
              </div>
              <Button className={styles.customerCheckoutClear} type="button" unstyled>
                Clear cart
              </Button>
            </div>

            <div className={styles.customerCheckoutBody}>
              <div className={styles.customerCheckoutLeft}>
                <section className={styles.customerCheckoutItem}>
                  <img
                    className={styles.customerCheckoutItemImage}
                    src={productImage}
                    alt="High Heel"
                  />
                  <div className={styles.customerCheckoutItemInfo}>
                    <div className={styles.customerCheckoutItemTop}>
                      <div>
                        <h2 className={styles.customerCheckoutItemTitle}>
                          Italian Creamy Quality High Heel
                        </h2>
                        <span className={styles.customerCheckoutItemPrice}>N125.09</span>
                      </div>
                      <Button
                        className={styles.customerCheckoutTrash}
                        type="button"
                        aria-label="Remove"
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
                        onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        unstyled
                      >
                        −
                      </Button>
                      <span className={styles.customerCheckoutQtyValue}>{quantity}</span>
                      <Button
                        className={styles.customerCheckoutQtyButton}
                        type="button"
                        onClick={() => setQuantity((prev) => prev + 1)}
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
                              size === option ? styles.customerCheckoutSizeActive : ""
                            }`}
                            type="button"
                            onClick={() => setSize(option)}
                            unstyled
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

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
                    <span>N125.09</span>
                  </div>
                  <Button
                    className={styles.customerCheckoutCta}
                    type="button"
                    onClick={() => {
                      setShowOrderSummary(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
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
              <div className={styles.customerCheckoutSummaryCard}>
                <img
                  className={styles.customerCheckoutSummaryImage}
                  src={productImage}
                  alt="Italian Creamy Quality High Heel"
                />
                <div className={styles.customerCheckoutSummaryDetails}>
                  <h3>Italian Creamy Quality High Heel</h3>
                  <div className={styles.customerCheckoutSummaryMeta}>
                    <span>Size:</span>
                    <span>Large</span>
                  </div>
                  <div className={styles.customerCheckoutSummaryMeta}>
                    <span>Colour:</span>
                    <span>Black</span>
                  </div>
                  <div className={styles.customerCheckoutSummaryMeta}>
                    <span>Quantity:</span>
                    <span>1</span>
                  </div>
                  <div className={styles.customerCheckoutSummaryMeta}>
                    <span>Total</span>
                    <span>N125.09</span>
                  </div>
                </div>
              </div>
              <div className={styles.customerCheckoutSummaryTotal}>
                <span>Total</span>
                <span>N125.09</span>
              </div>
            </section>

            <section className={styles.customerCheckoutBilling}>
              <h2 className={styles.customerCheckoutSectionTitle}>Billing Address</h2>
              <form className={styles.customerCheckoutBillingForm}>
                <label>
                  First Name <span>*</span>
                  <input type="text" placeholder="First Name" />
                </label>
                <label>
                  Last Name <span>*</span>
                  <input type="text" placeholder="Last Name" />
                </label>
                <label>
                  Email <span>*</span>
                  <input type="email" placeholder="Email" />
                </label>
                <label>
                  Address <span>*</span>
                  <input type="text" placeholder="Shipping address" />
                </label>
                <label>
                  Country <span>*</span>
                  <input type="text" placeholder="Country" />
                </label>
                <label>
                  State <span>*</span>
                  <input type="text" placeholder="State" />
                </label>
                <label>
                  City / Town <span>*</span>
                  <input type="text" placeholder="City / Town" />
                </label>
                <label>
                  Mobile Phone
                  <input type="tel" placeholder="Mobile Phone" />
                </label>
              </form>
            </section>

            <section className={styles.customerCheckoutBillingSummary}>
              <h2 className={styles.customerCheckoutSectionTitle}>Billing Summary</h2>
              <div className={styles.customerCheckoutBillingRows}>
                <div>
                  <span>Total Items</span>
                  <span>N125.00</span>
                </div>
                <div>
                  <span>Shipping</span>
                  <span>N8.00</span>
                </div>
                <div>
                  <span>Duties, taxes & fees</span>
                  <span>N1.00</span>
                </div>
                <div className={styles.customerCheckoutBillingTotal}>
                  <span>Total Order</span>
                  <span>N135.09</span>
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

              <Button className={styles.customerCheckoutPayButton} type="button" unstyled>
                Pay and Place Order
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
