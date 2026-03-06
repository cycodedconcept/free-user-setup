import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import styles from "../../../styles.module.css";
import { useDispatch, useSelector } from 'react-redux';
import { addPaymentGateway } from "../../../slice/paymentSlice";
import Swal from 'sweetalert2';

const GeneralSettings = () => {
  const dispatch = useDispatch();
  let token = localStorage.getItem("token");
  const { loading } = useSelector((state) => state.payment);
  const [activeSection, setActiveSection] = useState("appearance");
  const [paymentGateway, setPaymentGateway] = useState("paystack");
  const [paymentFields, setPaymentFields] = useState({
    publishKey: "pk_live_51N7Vel****",
    secretKey: "************",
    webhook: "https://yourdomain.com/webhook/paystack",
  });

  const handlePaymentFieldChange = (field) => (event) => {
    setPaymentFields((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSavePayment = async () => {
    if (!token) {
      await Swal.fire({
        icon: "error",
        title: "Not authenticated",
        text: "Please log in to save payment settings.",
      });
      return;
    }

    if (!paymentFields.publishKey || !paymentFields.secretKey || !paymentFields.webhook) {
      await Swal.fire({
        icon: "error",
        title: "Missing details",
        text: "Please fill in the publish key, secret key, and webhook URL.",
      });
      return;
    }

    const result = await dispatch(
      addPaymentGateway({
        token,
        gateway_name: paymentGateway,
        public_key: paymentFields.publishKey,
        secret_key: paymentFields.secretKey,
        webhook_secret: paymentFields.webhook,
        test_mode: false,
        is_default: true,
      })
    );

    if (addPaymentGateway.fulfilled.match(result)) {
      await Swal.fire({
        icon: "success",
        title: "Payment saved",
        text: `${paymentGateway} gateway has been saved successfully.`,
        confirmButtonText: "OK",
      });
      setPaymentGateway("Paystack");
      setPaymentFields({
        publishKey: "",
        secretKey: "",
        webhook: "",
      });
      return;
    }

    const errorMessage =
      result?.payload?.message ||
      result?.error?.message ||
      "Unable to save payment settings right now.";
    await Swal.fire({
      icon: "error",
      title: "Save failed",
      text: errorMessage,
    });
  };

  return (
    <div className={styles.vendorSettingsPage}>
      <header className={styles.vendorSettingsHeader}>
        <p>Mycroshop Settings</p>
        <small>Manage and customize your Mycroshop preferences</small>
      </header>

      <div className={styles.vendorSettingsLayout}>
        <nav className={styles.vendorSettingsNav} aria-label="Settings sections">
          <Button
            className={styles.vendorSettingsNavItem}
            type="button"
            onClick={() => setActiveSection("general")}
            unstyled
          >
            <span>General Settings</span>
            <span className={styles.vendorSettingsChevron} aria-hidden="true">
              &gt;
            </span>
          </Button>
          <Button
            className={`${styles.vendorSettingsNavItem} ${
              activeSection === "appearance" ? styles.vendorSettingsNavActive : ""
            }`}
            type="button"
            onClick={() => setActiveSection("appearance")}
            unstyled
          >
            <span>Appearance</span>
            <span className={styles.vendorSettingsChevron} aria-hidden="true">
              &gt;
            </span>
          </Button>
          <Button
            className={`${styles.vendorSettingsNavItem} ${
              activeSection === "payment" ? styles.vendorSettingsNavActive : ""
            }`}
            type="button"
            onClick={() => setActiveSection("payment")}
            unstyled
          >
            <span>Payment</span>
            <span className={styles.vendorSettingsChevron} aria-hidden="true">
              &gt;
            </span>
          </Button>
          <Button
            className={styles.vendorSettingsNavItem}
            type="button"
            onClick={() => setActiveSection("shipping")}
            unstyled
          >
            <span>Shipping</span>
            <span className={styles.vendorSettingsChevron} aria-hidden="true">
              &gt;
            </span>
          </Button>
        </nav>

        <div className={styles.vendorSettingsStack}>
          {activeSection === "appearance" && (
            <section className={styles.vendorSettingsCard}>
              <div className={styles.vendorSettingsCardHeader}>
                <h2>Store Appearance</h2>
                <p>Update the look and feel of your store</p>
              </div>

              <div className={styles.vendorSettingsDivider} />

              <div className={styles.vendorSettingsGrid}>
                <div className={styles.vendorSettingsField}>
                  <label className={styles.vendorSettingsLabel}>Primary Colour</label>
                  <div className={styles.vendorSettingsColorInput}>
                    <span
                      className={styles.vendorSettingsColorSwatch}
                      style={{ backgroundColor: "#78716C" }}
                    />
                    <span className={styles.vendorSettingsValue}>#78716C</span>
                  </div>
                </div>
                <div className={styles.vendorSettingsField}>
                  <label className={styles.vendorSettingsLabel}>Secondary Colour</label>
                  <div className={styles.vendorSettingsColorInput}>
                    <span
                      className={styles.vendorSettingsColorSwatch}
                      style={{ backgroundColor: "#FFFFFF" }}
                    />
                    <span className={styles.vendorSettingsValue}>#FFFFFF</span>
                  </div>
                </div>
              </div>

              <div className={styles.vendorSettingsField}>
                <label className={styles.vendorSettingsLabel}>Font</label>
                <div className={styles.vendorSettingsSelect}>
                  <span className={styles.vendorSettingsValue}>Select font</span>
                  <span className={styles.vendorSettingsSelectIcon} aria-hidden="true">
                    v
                  </span>
                </div>
              </div>

              <div className={styles.vendorSettingsThemeBlock}>
                <h3>Theme</h3>
                <div className={styles.vendorSettingsDividerThin} />
                <div className={styles.vendorSettingsThemeRow}>
                  <span>Dark Theme</span>
                  <span className={styles.vendorSettingsRadio} aria-hidden="true" />
                </div>
                <div className={styles.vendorSettingsThemeRow}>
                  <span>Light Theme</span>
                  <span
                    className={`${styles.vendorSettingsRadio} ${styles.vendorSettingsRadioActive}`}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </section>
          )}

          {activeSection === "payment" && (
            <>
              <section className={styles.vendorSettingsCard}>
                <div className={styles.vendorSettingsCardHeader}>
                  <h2>Payment</h2>
                  <p>Configure payment gateways for transaction processing</p>
                </div>

                <div className={styles.vendorSettingsDivider} />

                <div className={styles.vendorSettingsField}>
                  <label className={styles.vendorSettingsLabel}>Payment Gateway</label>
                  <div className={styles.vendorSettingsSelectWrapper}>
                    <select
                      className={styles.vendorSettingsSelectInput}
                      value={paymentGateway}
                      onChange={(event) => setPaymentGateway(event.target.value)}
                    >
                      <option value="paystack">Paystack</option>
                      <option value="flutterwave">Flutterwave</option>
                    </select>
                    <span className={styles.vendorSettingsSelectIcon} aria-hidden="true">
                      v
                    </span>
                  </div>
                </div>

                <div className={styles.vendorSettingsField}>
                  <label className={styles.vendorSettingsLabel}>API Key Publish Key</label>
                  <input
                    className={styles.vendorSettingsInput}
                    type="text"
                    value={paymentFields.publishKey}
                    onChange={handlePaymentFieldChange("publishKey")}
                  />
                </div>

                <div className={styles.vendorSettingsField}>
                  <label className={styles.vendorSettingsLabel}>Secrete Key</label>
                  <input
                    className={styles.vendorSettingsInput}
                    type="password"
                    value={paymentFields.secretKey}
                    onChange={handlePaymentFieldChange("secretKey")}
                  />
                </div>

                <div className={styles.vendorSettingsField}>
                  <label className={styles.vendorSettingsLabel}>Webhook</label>
                  <input
                    className={styles.vendorSettingsInput}
                    type="text"
                    value={paymentFields.webhook}
                    onChange={handlePaymentFieldChange("webhook")}
                  />
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      <div className={styles.vendorSettingsFooter}>
        <Button
          className={styles.vendorSettingsSave}
          type="button"
          onClick={activeSection === "payment" ? handleSavePayment : undefined}
          disabled={activeSection === "payment" ? loading : false}
          unstyled
        >
          {activeSection === "payment" ? (
            loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )
          ) : (
            "Save Details"
          )}
        </Button>
      </div>
    </div>
  );
};

export default GeneralSettings;
