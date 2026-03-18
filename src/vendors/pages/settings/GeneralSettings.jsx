import React, { useEffect, useRef, useState } from "react";
import Button from "../../../components/ui/Button";
import styles from "../../../styles.module.css";
import { useDispatch, useSelector } from 'react-redux';
import { addPaymentGateway } from "../../../slice/paymentSlice";
import { getMyOnlineStore } from "../../../slice/onlineStoreSlice";
import { Ac } from "../../../assets";
import Swal from 'sweetalert2';
import useAppTheme from "../../../hooks/useAppTheme";

const resolveStoreInfo = (myStore) =>
  myStore?.onlineStore ||
  myStore?.data?.onlineStore ||
  myStore?.store ||
  {};

const GeneralSettings = () => {
  const dispatch = useDispatch();
  let token = localStorage.getItem("token");
  const { loading } = useSelector((state) => state.payment);
  const myStore = useSelector((state) => state.store?.myStore);
  const storeInfo = resolveStoreInfo(myStore);
  const [activeSection, setActiveSection] = useState("general");
  const { theme: appearanceTheme, isDarkTheme, setTheme: setAppearanceTheme } = useAppTheme();
  const [paymentGateway, setPaymentGateway] = useState("paystack");
  const [paymentFields, setPaymentFields] = useState({
    publishKey: "pk_live_51N7Vel****",
    secretKey: "************",
    webhook: "https://yourdomain.com/webhook/paystack",
  });
  const [generalFields, setGeneralFields] = useState({
    storeName: "",
    storeDescription: "",
    storeAddress: "",
    contactNumber: "",
  });
  const [imagePreview, setImagePreview] = useState({
    logo: "",
    banner: "",
  });
  const [shippingMethods, setShippingMethods] = useState([
    {
      id: 1,
      name: "Standard Delivery",
      deliveryZones: "All states",
      estimatedDays: "3 days",
      rate: "₦5000",
      active: true,
    },
    {
      id: 2,
      name: "Express Delivery",
      deliveryZones: "All states",
      estimatedDays: "1 days",
      rate: "₦5000",
      active: true,
    },
    {
      id: 3,
      name: "Economy Delivery",
      deliveryZones: "All states",
      estimatedDays: "5 days",
      rate: "₦5000",
      active: true,
    },
  ]);
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    if (token && !storeInfo?.id) {
      dispatch(getMyOnlineStore({ token }));
    }
  }, [dispatch, token, storeInfo?.id]);

  useEffect(() => {
    setGeneralFields({
      storeName: storeInfo?.store_name || "",
      storeDescription: storeInfo?.store_description || "",
      storeAddress:
        storeInfo?.address ||
        storeInfo?.store_address ||
        storeInfo?.business_address ||
        "",
      contactNumber:
        storeInfo?.phone ||
        storeInfo?.phone_number ||
        storeInfo?.contact_number ||
        "",
    });
    setImagePreview({
      logo: storeInfo?.profile_logo_url || "",
      banner: storeInfo?.banner_url || storeInfo?.cover_image_url || "",
    });
  }, [
    storeInfo?.address,
    storeInfo?.business_address,
    storeInfo?.contact_number,
    storeInfo?.cover_image_url,
    storeInfo?.phone,
    storeInfo?.phone_number,
    storeInfo?.profile_logo_url,
    storeInfo?.banner_url,
    storeInfo?.store_address,
    storeInfo?.store_description,
    storeInfo?.store_name,
  ]);

  const handlePaymentFieldChange = (field) => (event) => {
    setPaymentFields((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleGeneralFieldChange = (field) => (event) => {
    setGeneralFields((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleImageSelect = (type) => {
    const inputRef = type === "logo" ? logoInputRef : bannerInputRef;
    inputRef.current?.click();
  };

  const handleImageChange = (type) => (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview((prev) => ({
        ...prev,
        [type]: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleToggleShippingMethod = (methodId) => {
    setShippingMethods((prev) =>
      prev.map((method) =>
        method.id === methodId ? { ...method, active: !method.active } : method
      )
    );
  };

  const appearancePalette =
    appearanceTheme === "dark"
      ? {
          primary: "#111827",
          secondary: "#F9FAFB",
        }
      : {
          primary: "#78716C",
          secondary: "#FFFFFF",
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
    <div
      className={`${styles.vendorSettingsPage} ${
        isDarkTheme ? styles.vendorSettingsPageDark : ""
      }`}
    >
      <header className={styles.vendorSettingsHeader}>
        <p>Mycroshop Settings</p>
        <small>Manage and customize your Mycroshop preferences</small>
      </header>

      <div className={styles.vendorSettingsLayout}>
        <nav className={styles.vendorSettingsNav} aria-label="Settings sections">
          <Button
            className={`${styles.vendorSettingsNavItem} ${
              activeSection === "general" ? styles.vendorSettingsNavActive : ""
            }`}
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
            className={`${styles.vendorSettingsNavItem} ${
              activeSection === "shipping" ? styles.vendorSettingsNavActive : ""
            }`}
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
          {activeSection === "general" && (
            <section className={styles.vendorSettingsCard}>
              <div className={styles.vendorSettingsCardTop}>
                <div className={styles.vendorSettingsCardHeader}>
                  <h2>Store Information</h2>
                  <p>Update your store details</p>
                </div>
                <button type="button" className={styles.vendorSettingsDeleteAction}>
                  Delete Account
                </button>
              </div>

              <div className={styles.vendorSettingsDivider} />

              <div className={styles.vendorSettingsField}>
                <label className={styles.vendorSettingsLabel}>Store Name</label>
                <input
                  className={styles.vendorSettingsInput}
                  type="text"
                  value={generalFields.storeName}
                  onChange={handleGeneralFieldChange("storeName")}
                  placeholder="Enter store name"
                />
              </div>

              <div className={styles.vendorSettingsField}>
                <label className={styles.vendorSettingsLabel}>Store Description</label>
                <textarea
                  className={styles.vendorSettingsTextarea}
                  value={generalFields.storeDescription}
                  onChange={handleGeneralFieldChange("storeDescription")}
                  placeholder="Description"
                />
              </div>

              <div className={styles.vendorSettingsField}>
                <label className={styles.vendorSettingsLabel}>Store Logo</label>
                <div className={styles.vendorSettingsUploadPanel}>
                  <div className={styles.vendorSettingsUploadInner}>
                    <div className={`${styles.vendorSettingsUploadPreview} ${styles.vendorSettingsUploadPreviewRound}`}>
                      {imagePreview.logo ? (
                        <img src={imagePreview.logo} alt="Store logo preview" />
                      ) : (
                        <div className={styles.vendorSettingsUploadPlaceholder} />
                      )}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange("logo")}
                      hidden
                    />
                    <button
                      type="button"
                      className={styles.vendorSettingsUploadButton}
                      onClick={() => handleImageSelect("logo")}
                    >
                      <img src={Ac} alt="" className={styles.vendorSettingsUploadIcon} />
                      Upload Image
                    </button>
                    <p className={styles.vendorSettingsUploadNote}>
                      Recommended: Square image, at least 300*300px
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.vendorSettingsField}>
                <label className={styles.vendorSettingsLabel}>Store Banner</label>
                <div className={styles.vendorSettingsUploadPanel}>
                  <div className={styles.vendorSettingsUploadInner}>
                    <div className={`${styles.vendorSettingsUploadPreview} ${styles.vendorSettingsUploadPreviewBanner}`}>
                      {imagePreview.banner ? (
                        <img src={imagePreview.banner} alt="Store banner preview" />
                      ) : (
                        <div className={styles.vendorSettingsUploadPlaceholderBanner} />
                      )}
                    </div>
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange("banner")}
                      hidden
                    />
                    <button
                      type="button"
                      className={styles.vendorSettingsUploadButton}
                      onClick={() => handleImageSelect("banner")}
                    >
                      <img src={Ac} alt="" className={styles.vendorSettingsUploadIcon} />
                      Upload Image
                    </button>
                    <p className={styles.vendorSettingsUploadNote}>
                      Recommended: Wide image, at least 1200*400px
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.vendorSettingsField}>
                <label className={styles.vendorSettingsLabel}>Store Address</label>
                <input
                  className={styles.vendorSettingsInput}
                  type="text"
                  value={generalFields.storeAddress}
                  onChange={handleGeneralFieldChange("storeAddress")}
                  placeholder="Enter store address"
                />
              </div>

              <div className={styles.vendorSettingsField}>
                <label className={styles.vendorSettingsLabel}>Contact Number</label>
                <input
                  className={styles.vendorSettingsInput}
                  type="text"
                  value={generalFields.contactNumber}
                  onChange={handleGeneralFieldChange("contactNumber")}
                  placeholder="Enter contact number"
                />
              </div>
            </section>
          )}

          {activeSection === "appearance" && (
            <section className={styles.vendorSettingsCard}>
              <div className={styles.vendorSettingsCardHeader}>
                <h2>Store Appearance</h2>
                <p>Update the look and feel of your store</p>
              </div>

              <div
                className={`${styles.vendorSettingsDivider} ${
                  isDarkTheme ? styles.vendorSettingsDividerDark : ""
                }`}
              />

              <div className={styles.vendorSettingsGrid}>
                <div className={styles.vendorSettingsField}>
                  <label
                    className={`${styles.vendorSettingsLabel} ${
                      isDarkTheme ? styles.vendorSettingsLabelDark : ""
                    }`}
                  >
                    Primary Colour
                  </label>
                  <div
                    className={`${styles.vendorSettingsColorInput} ${
                      isDarkTheme ? styles.vendorSettingsColorInputDark : ""
                    }`}
                  >
                    <span
                      className={styles.vendorSettingsColorSwatch}
                      style={{ backgroundColor: appearancePalette.primary }}
                    />
                    <span
                      className={`${styles.vendorSettingsValue} ${
                        isDarkTheme ? styles.vendorSettingsValueDark : ""
                      }`}
                    >
                      {appearancePalette.primary}
                    </span>
                  </div>
                </div>
                <div className={styles.vendorSettingsField}>
                  <label
                    className={`${styles.vendorSettingsLabel} ${
                      isDarkTheme ? styles.vendorSettingsLabelDark : ""
                    }`}
                  >
                    Secondary Colour
                  </label>
                  <div
                    className={`${styles.vendorSettingsColorInput} ${
                      isDarkTheme ? styles.vendorSettingsColorInputDark : ""
                    }`}
                  >
                    <span
                      className={styles.vendorSettingsColorSwatch}
                      style={{ backgroundColor: appearancePalette.secondary }}
                    />
                    <span
                      className={`${styles.vendorSettingsValue} ${
                        isDarkTheme ? styles.vendorSettingsValueDark : ""
                      }`}
                    >
                      {appearancePalette.secondary}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.vendorSettingsField}>
                <label
                  className={`${styles.vendorSettingsLabel} ${
                    isDarkTheme ? styles.vendorSettingsLabelDark : ""
                  }`}
                >
                  Font
                </label>
                <div
                  className={`${styles.vendorSettingsSelect} ${
                    isDarkTheme ? styles.vendorSettingsSelectDark : ""
                  }`}
                >
                  <span
                    className={`${styles.vendorSettingsValue} ${
                      isDarkTheme ? styles.vendorSettingsValueDark : ""
                    }`}
                  >
                    Select font
                  </span>
                  <span
                    className={`${styles.vendorSettingsSelectIcon} ${
                      isDarkTheme ? styles.vendorSettingsSelectIconDark : ""
                    }`}
                    aria-hidden="true"
                  >
                    v
                  </span>
                </div>
              </div>

              <div className={styles.vendorSettingsThemeBlock}>
                <h3 className={isDarkTheme ? styles.vendorSettingsThemeTitleDark : ""}>
                  Theme
                </h3>
                <div
                  className={`${styles.vendorSettingsDividerThin} ${
                    isDarkTheme ? styles.vendorSettingsDividerThinDark : ""
                  }`}
                />
                <button
                  type="button"
                  className={`${styles.vendorSettingsThemeRow} ${
                    isDarkTheme ? styles.vendorSettingsThemeRowDark : ""
                  }`}
                  onClick={() => setAppearanceTheme("dark")}
                >
                  <span>Dark Theme</span>
                  <span
                    className={`${styles.vendorSettingsRadio} ${
                      isDarkTheme ? styles.vendorSettingsRadioDark : ""
                    } ${appearanceTheme === "dark" ? styles.vendorSettingsRadioActive : ""}`}
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  className={`${styles.vendorSettingsThemeRow} ${
                    isDarkTheme ? styles.vendorSettingsThemeRowDark : ""
                  }`}
                  onClick={() => setAppearanceTheme("light")}
                >
                  <span>Light Theme</span>
                  <span
                    className={`${styles.vendorSettingsRadio} ${
                      isDarkTheme ? styles.vendorSettingsRadioDark : ""
                    } ${appearanceTheme === "light" ? styles.vendorSettingsRadioActive : ""}`}
                    aria-hidden="true"
                  />
                </button>
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

          {activeSection === "shipping" && (
            <>
              <div className={styles.vendorSettingsSectionHeader}>
                <div className={styles.vendorSettingsSectionIntro}>
                  <h2>Shipping Information</h2>
                  <p>Manage available shipping methods and services</p>
                </div>
                <button type="button" className={styles.vendorSettingsPrimaryAction}>
                  Add Shipping Information
                </button>
              </div>

              <div className={styles.vendorSettingsShippingGrid}>
                {shippingMethods.map((method) => (
                  <section key={method.id} className={styles.vendorSettingsShippingCard}>
                    <div className={styles.vendorSettingsShippingTop}>
                      <div>
                        <h3>{method.name}</h3>
                        <p>Delivery Zones: <span>{method.deliveryZones}</span></p>
                        <p>Est. Days: <span>{method.estimatedDays}</span></p>
                      </div>
                      <button type="button" className={styles.vendorSettingsMoreAction}>
                        ⋮
                      </button>
                    </div>

                    <div className={styles.vendorSettingsShippingBottom}>
                      <span className={styles.vendorSettingsShippingRate}>Rate: {method.rate}</span>

                      <button
                        type="button"
                        className={styles.vendorSettingsShippingToggleWrap}
                        onClick={() => handleToggleShippingMethod(method.id)}
                        aria-pressed={method.active}
                      >
                        <span className={styles.vendorSettingsShippingToggleLabel}>Active</span>
                        <span
                          className={`${styles.vendorSettingsShippingToggle} ${
                            method.active ? styles.vendorSettingsShippingToggleActive : ""
                          }`}
                          aria-hidden="true"
                        >
                          <span className={styles.vendorSettingsShippingToggleKnob} />
                        </span>
                      </button>
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {activeSection !== "shipping" && (
        <div className={styles.vendorSettingsFooter}>
          <Button
            className={styles.vendorSettingsSave}
            type="button"
            onClick={activeSection === "payment" ? handleSavePayment : undefined}
            disabled={activeSection === "payment" ? loading : true}
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
      )}
    </div>
  );
};

export default GeneralSettings;
