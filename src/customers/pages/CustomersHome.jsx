import React, { useMemo, useState, useEffect } from "react";
import {
  bookService,
  getOnlineEcommerceStore,
  setBookingPayload,
  updateBookingField,
  updateBookingMetadataField,
  getServices
} from "../../slice/customerFacingSlice";
import { getServiceAvailability } from "../../slice/onlineStoreSlice";
import { useDispatch, useSelector } from 'react-redux';
import styles from "../../styles.module.css";
import Button from "../../components/ui/Button";
import storeAvatar from "../../assets/logo.jpg";
import serviceOne from "../../assets/ph4.png";
import serviceTwo from "../../assets/ph5.png";
import serviceThree from "../../assets/ph6.png";
import productOne from "../../assets/bp.png";
import productTwo from "../../assets/bp2.png";
import productThree from "../../assets/bp3.png";
import productFour from "../../assets/ph2.png";
import productFive from "../../assets/ph3.png";
import productSix from "../../assets/ph.png";

const EMPTY_ARRAY = [];
const SERVICES_PAGE_LIMIT = 20;

const fallbackServiceImages = [serviceOne, serviceTwo, serviceThree];
const fallbackProductImages = [productOne, productTwo, productThree, productFour, productFive, productSix];

const formatNaira = (value) => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("₦")) return trimmed;
    if (trimmed.startsWith("N")) return `₦${trimmed.slice(1).trim()}`;
    const normalized = trimmed.replace(/,/g, "");
    const numericFromString = Number(normalized);
    if (!Number.isFinite(numericFromString)) return `₦${trimmed}`;
    const hasDecimals = numericFromString % 1 !== 0;
    return `₦${numericFromString.toLocaleString("en-NG", {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: hasDecimals ? 2 : 0,
    })}`;
  }
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return String(value);
  const hasDecimals = numberValue % 1 !== 0;
  return `₦${numberValue.toLocaleString("en-NG", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  })}`;
};

const formatDuration = (minutes) => {
  const numericMinutes = Number(minutes);
  if (!Number.isFinite(numericMinutes)) return "";
  if (numericMinutes <= 0) return "";
  if (numericMinutes < 60) return `${numericMinutes}min`;
  const hours = Math.floor(numericMinutes / 60);
  const remaining = numericMinutes % 60;
  if (!remaining) return `${hours}hr`;
  return `${hours}hr ${remaining}min`;
};

const normalizeAvailability = (availability) => {
  if (!availability) return {};
  if (typeof availability === "object") return availability;
  if (typeof availability !== "string") return {};
  try {
    const parsed = JSON.parse(availability);
    if (typeof parsed === "string") {
      return JSON.parse(parsed);
    }
    return parsed || {};
  } catch (error) {
    return {};
  }
};

const getWeekdayKeyFromDate = (dateValue) => {
  if (!dateValue) return "";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
};

const toDateInputValue = (isoValue) => {
  if (!isoValue) return "";
  const parsed = new Date(isoValue);
  if (Number.isNaN(parsed.getTime())) return "";
  const offsetMs = parsed.getTimezoneOffset() * 60000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 10);
};

const toTimeInputValue = (isoValue) => {
  if (!isoValue) return "";
  const parsed = new Date(isoValue);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const getServiceImage = (imageUrl, fallbackIndex) => {
  if (!imageUrl) return fallbackServiceImages[fallbackIndex % fallbackServiceImages.length];
  const trimmed = imageUrl.toString().trim();
  if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") {
    return fallbackServiceImages[fallbackIndex % fallbackServiceImages.length];
  }
  return trimmed;
};

const parseAmount = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const numeric = Number(value.toString().replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
};

const toDateTimeInputValue = (isoValue) => {
  if (!isoValue) return "";
  const parsed = new Date(isoValue);
  if (Number.isNaN(parsed.getTime())) return "";
  const offsetMs = parsed.getTimezoneOffset() * 60000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
};

const getScheduleLabels = (scheduledAt, timezone) => {
  if (!scheduledAt) {
    return { dateLabel: "To be scheduled", timeLabel: "To be scheduled" };
  }
  const parsed = new Date(scheduledAt);
  if (Number.isNaN(parsed.getTime())) {
    return { dateLabel: scheduledAt, timeLabel: "" };
  }
  const dateOptions = {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(timezone ? { timeZone: timezone } : {}),
  };
  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    ...(timezone ? { timeZone: timezone } : {}),
  };
  return {
    dateLabel: parsed.toLocaleDateString("en-US", dateOptions),
    timeLabel: parsed.toLocaleTimeString("en-US", timeOptions),
  };
};

const formatLocationType = (locationType) => {
  if (!locationType) return "In-person";
  if (locationType === "virtual") return "Virtual";
  if (locationType === "in_person") return "In-person";
  return locationType.toString().replace(/[_-]+/g, " ");
};

const formatPlatformLabel = (platform) => {
  if (!platform) return "Social";
  return platform
    .toString()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

const getSocialClassName = (platform, styles) => {
  const key = platform?.toString().toLowerCase?.() || "";
  if (key === "x" || key === "twitter") return styles.customerHomeShareX;
  if (key === "facebook") return styles.customerHomeShareFacebook;
  if (key === "linkedin") return styles.customerHomeShareLinkedIn;
  if (key === "whatsapp") return styles.customerHomeShareWhatsApp;
  return styles.customerHomeShareLink;
};

const getSocialIcon = (platform) => {
  const key = platform?.toString().toLowerCase?.() || "";
  if (key === "x" || key === "twitter") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.9 3.5h2.6l-6 6.9 6.6 10.1h-5.1l-4-5.7-4.8 5.7H5l6.5-7.5L4.9 3.5H10l3.7 5.1 5.2-5.1z" />
      </svg>
    );
  }
  if (key === "facebook") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 9H16V6h-2.5C11.6 6 10 7.6 10 9.5V11H8v3h2v6h3v-6h2.3l.7-3H13V9.5c0-.3.2-.5.5-.5z" />
      </svg>
    );
  }
  if (key === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.52 3.49A11.86 11.86 0 0 0 12.01 0C5.4 0 .03 5.37.03 11.98c0 2.11.55 4.17 1.6 5.99L0 24l6.2-1.62a11.93 11.93 0 0 0 5.8 1.48h.01c6.6 0 11.98-5.37 11.98-11.98 0-3.2-1.25-6.21-3.47-8.39zM12 21.3h-.01a9.37 9.37 0 0 1-4.78-1.32l-.34-.2-3.68.96.98-3.58-.22-.37a9.33 9.33 0 0 1-1.44-5.02c0-5.14 4.19-9.33 9.34-9.33a9.28 9.28 0 0 1 6.6 2.74 9.28 9.28 0 0 1 2.73 6.59c0 5.14-4.19 9.33-9.33 9.33zm5.1-6.96c-.28-.14-1.64-.81-1.89-.9-.25-.09-.43-.14-.62.14-.19.28-.72.9-.88 1.08-.16.18-.32.2-.6.06-.28-.14-1.2-.44-2.29-1.41-.84-.75-1.4-1.67-1.56-1.95-.16-.28-.02-.44.12-.58.13-.13.28-.32.42-.48.14-.16.19-.28.28-.47.09-.19.05-.36-.02-.5-.07-.14-.62-1.5-.85-2.05-.23-.55-.47-.48-.65-.48h-.56c-.19 0-.5.07-.76.36-.26.28-1 1-1 2.3 0 1.3 1.02 2.56 1.16 2.74.14.19 2.01 3.06 4.87 4.3.68.29 1.2.46 1.61.59.68.22 1.29.19 1.78.11.54-.08 1.64-.68 1.87-1.35.23-.67.23-1.24.16-1.35-.07-.11-.26-.18-.54-.32z" />
      </svg>
    );
  }
  if (key === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6.5 9H3.8v11h2.7V9zM5.1 4.2a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zM20.5 13.3c0-2.5-1.6-4.4-4-4.4-1.3 0-2.1.7-2.5 1.4V9h-2.6v11h2.6v-6c0-1.6.6-2.6 2-2.6 1.1 0 1.7.8 1.7 2.6v6h2.8v-6.7z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor">
      <path
        d="M10 13a5 5 0 0 1 0-7l2-2a5 5 0 0 1 7 7l-2 2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 11a5 5 0 0 1 0 7l-2 2a5 5 0 0 1-7-7l2-2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const getServiceBookingMeta = (service) => {
  if (!service) {
    return { name: "", duration: "", price: "" };
  }
  const [namePart, pricePart] = service.title.split(" - ");
  const durationMatch = namePart.match(/\(([^)]+)\)/);
  const name = namePart.replace(/\s*\([^)]*\)\s*/, "").trim();
  return {
    name: name || service.title,
    duration: durationMatch ? durationMatch[1] : "",
    price: pricePart || "",
  };
};

const CollectionDetailView = ({ collection, onBack, onSelectProduct, storeLogo, storeName }) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <section className={styles.customerHomeCollectionDetail}>
      <header className={styles.customerHomeDetailHeader}>
        <Button
          className={styles.customerHomeBackButton}
          type="button"
          onClick={onBack}
          aria-label="Back to collections"
          unstyled
        >
          ←
        </Button>
        <span className={styles.customerHomeDetailTitle}>{collection.title}</span>
      </header>

      <div className={styles.customerHomeSearchRow}>
        <img
          className={styles.customerHomeMiniAvatar}
          src={storeLogo || storeAvatar}
          alt={storeName || "Store"}
        />
        <div className={styles.customerHomeSearchBar}>
          <span className={styles.customerHomeSearchIcon} aria-hidden="true">
            🔍
          </span>
          <input
            className={styles.customerHomeSearchInput}
            type="text"
            placeholder="Search products..."
          />
        </div>
        <Button
          className={styles.customerHomeFilterButton}
          type="button"
          aria-label="Filter"
          onClick={() => setShowFilters(true)}
          unstyled
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor">
            <path
              d="M4 7h10M18 7h2M10 7a2 2 0 1 1-4 0a2 2 0 0 1 4 0Zm4 10H4M20 17h-2M18 17a2 2 0 1 1-4 0a2 2 0 0 1 4 0Z"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>

      <div className={styles.customerHomeCollectionMeta}>
        <h2 className={styles.customerHomeSectionTitle}>{collection.title}</h2>
        <span className={styles.customerHomeCollectionCountMeta}>{collection.count}</span>
      </div>

      <div className={styles.customerHomeFeaturedRow}>
        <span className={styles.customerHomeFeaturedLabel}>Featured</span>
        <span className={styles.customerHomePinnedBadge}>Pinned</span>
      </div>

      <div className={styles.customerHomeProductGrid}>
        {collection.products.map((product) => (
          <Button
            className={styles.customerHomeProductCard}
            key={product.id || product.title}
            type="button"
            onClick={() => onSelectProduct(product)}
            unstyled
          >
            <div className={styles.customerHomeProductImageWrap}>
              <img
                className={styles.customerHomeProductImage}
                src={product.image}
                alt={product.title}
              />
            </div>
            <div className={styles.customerHomeProductBody}>
              <h3 className={styles.customerHomeProductTitle}>{product.title}</h3>
              <p className={styles.customerHomeProductDesc}>{product.description}</p>
              <span className={styles.customerHomeProductPrice}>{product.price}</span>
            </div>
          </Button>
        ))}
      </div>

      {showFilters && (
        <div className={styles.customerHomeFilterOverlay} role="dialog" aria-modal="true">
          <Button
            className={styles.customerHomeFilterBackdrop}
            type="button"
            aria-label="Close filters"
            onClick={() => setShowFilters(false)}
            unstyled
          />
          <aside className={styles.customerHomeFilterPanel}>
            <div className={styles.customerHomeFilterHeader}>
              <h3 className={styles.customerHomeFilterTitle}>Filters</h3>
              <Button
                className={styles.customerHomeFilterClose}
                type="button"
                aria-label="Close filters"
                onClick={() => setShowFilters(false)}
                unstyled
              >
                ×
              </Button>
            </div>

            <div className={styles.customerHomeFilterSection}>
              <p className={styles.customerHomeFilterSectionTitle}>Sort by</p>
              <label className={styles.customerHomeFilterOption}>
                <input type="checkbox" defaultChecked />
                <span>Featured</span>
              </label>
              <label className={styles.customerHomeFilterOption}>
                <input type="checkbox" />
                <span>Best selling</span>
              </label>
              <label className={styles.customerHomeFilterOption}>
                <input type="checkbox" />
                <span>Alphabetically, A-Z</span>
              </label>
              <label className={styles.customerHomeFilterOption}>
                <input type="checkbox" />
                <span>Price, low to high price, high to low</span>
              </label>
              <label className={styles.customerHomeFilterOption}>
                <input type="checkbox" />
                <span>Newest</span>
              </label>
              <label className={styles.customerHomeFilterOption}>
                <input type="checkbox" />
                <span>Oldest</span>
              </label>
            </div>

            <div className={styles.customerHomeFilterSection}>
              <p className={styles.customerHomeFilterSectionTitle}>Location</p>
              <label className={styles.customerHomeFilterOption}>
                <input type="checkbox" defaultChecked />
                <span>Lagos</span>
              </label>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};

const ProductDetailView = ({ product, onBack, storeName }) => {
  const [selectedSize, setSelectedSize] = useState("16");
  const [quantity, setQuantity] = useState(1);
  const sizes = ["8", "16", "18"];

  return (
    <section className={styles.customerHomeProductDetail}>
      <header className={styles.customerHomeProductHeader}>
        <Button
          className={styles.customerHomeBackButton}
          type="button"
          onClick={onBack}
          unstyled
        >
          ←
        </Button>
        <span className={styles.customerHomeProductHeaderTitle}>
          {storeName || "Awesome Store"}
        </span>
        <Button
          className={styles.customerHomeCartButton}
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
          <span className={styles.customerHomeCartBadge}>0</span>
        </Button>
      </header>

      <div className={styles.customerHomeProductMain}>
        <div className={styles.customerHomeProductHero}>
          <img src={product.image} alt={product.title} />
        </div>

        <div className={styles.customerHomeProductInfo}>
          <div>
            <h2 className={styles.customerHomeProductTitleLarge}>{product.title}</h2>
            <p className={styles.customerHomeProductDescLarge}>{product.description}</p>
          </div>
          <div className={styles.customerHomeProductPriceLarge}>{product.price}</div>
          <div className={styles.customerHomeDetailDivider} />

          <div className={styles.customerHomeDetailGroup}>
            <span className={styles.customerHomeDetailLabel}>Size</span>
            <div className={styles.customerHomeSizeOptions}>
              {sizes.map((size) => (
                <Button
                  key={size}
                  type="button"
                  className={`${styles.customerHomeSizeOption} ${
                    selectedSize === size ? styles.customerHomeSizeOptionActive : ""
                  }`}
                  onClick={() => setSelectedSize(size)}
                  unstyled
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          <div className={styles.customerHomeDetailGroup}>
            <span className={styles.customerHomeDetailLabel}>Quantity</span>
            <div className={styles.customerHomeQuantityControl}>
              <Button
                className={styles.customerHomeQuantityButton}
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                unstyled
              >
                −
              </Button>
              <span className={styles.customerHomeQuantityValue}>{quantity}</span>
              <Button
                className={styles.customerHomeQuantityButton}
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                unstyled
              >
                +
              </Button>
            </div>
          </div>

          <Button className={styles.customerHomeAddToCartButton} type="button" unstyled>
            Add to Cart
          </Button>
        </div>
      </div>
    </section>
  );
};

const BookingConfirmation = ({ service, scheduledAt, timezone, locationType, onClose, onCancel }) => {
  const bookingMeta = getServiceBookingMeta(service);
  const { dateLabel, timeLabel } = getScheduleLabels(scheduledAt, timezone);
  const locationLabel = formatLocationType(locationType);

  return (
    <div className={styles.customerHomeConfirmOverlay} role="dialog" aria-modal="true">
      <Button
        className={styles.customerHomeConfirmBackdrop}
        type="button"
        aria-label="Close confirmation"
        onClick={onClose}
        unstyled
      />
      <div className={styles.customerHomeConfirmCard}>
        <div className={styles.customerHomeConfirmHeader}>
          <div>
            <p className={styles.customerHomeConfirmEyebrow}>Booking Appointment</p>
            <h2 className={styles.customerHomeConfirmTitle}>Confirmed</h2>
          </div>
          <Button
            className={styles.customerHomeConfirmClose}
            type="button"
            aria-label="Close"
            onClick={onClose}
            unstyled
          >
            ×
          </Button>
        </div>

        <div className={styles.customerHomeConfirmBanner}>
          <span>Booking</span>
          <span className={styles.customerHomeConfirmId}>Booking ID #APT-28571</span>
        </div>

        <div className={styles.customerHomeConfirmBody}>
          <h3 className={styles.customerHomeConfirmService}>
            {bookingMeta.name || service?.title}
            {bookingMeta.duration ? ` (${bookingMeta.duration})` : ""}
          </h3>
          <p className={styles.customerHomeConfirmStore}>with Awesome Beauty</p>

          <div className={styles.customerHomeConfirmDetails}>
            <div className={styles.customerHomeConfirmRow}>
              <span className={styles.customerHomeConfirmIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="3" strokeWidth="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" />
                </svg>
              </span>
              <div>
                <span className={`text-start ${styles.customerHomeConfirmLabel}`}>Date</span>
                <span className={styles.customerHomeConfirmValue}>{dateLabel}</span>
              </div>
            </div>
            <div className={styles.customerHomeConfirmRow}>
              <span className={styles.customerHomeConfirmIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="9" strokeWidth="2" />
                  <path d="M12 7v5l3 2" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <span className={`text-start ${styles.customerHomeConfirmLabel}`}>Time</span>
                <span className={styles.customerHomeConfirmValue}>{timeLabel}</span>
              </div>
            </div>
            <div className={styles.customerHomeConfirmRow}>
              <span className={styles.customerHomeConfirmIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor">
                  <path
                    d="M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"
                    strokeWidth="2"
                  />
                  <circle cx="12" cy="10" r="2.5" strokeWidth="2" />
                </svg>
              </span>
              <div>
                <span className={`text-start ${styles.customerHomeConfirmLabel}`}>Location</span>
                <span className={styles.customerHomeConfirmValue}>{locationLabel}</span>
              </div>
            </div>
          </div>

          <div className={styles.customerHomeConfirmNote}>
            Please arrive 15 minutes before your appointment. Don't forget <br/>to bring your
            insurance card and ID.
          </div>

          <div className={styles.customerHomeConfirmActions}>
            <Button className={styles.customerHomeConfirmPrimary} type="button" unstyled>
              Add to Calendar
            </Button>
            <Button
              className={styles.customerHomeConfirmGhost}
              type="button"
              onClick={onCancel}
              unstyled
            >
              Cancel Appointment
            </Button>
          </div>

          <p className={styles.customerHomeConfirmHelp}>
            Need to reschedule? Call us at (+234) 123-4567
          </p>
        </div>
      </div>
    </div>
  );
};

const CancelAppointment = ({ service, scheduledAt, timezone, onClose, onConfirm }) => {
  const bookingMeta = getServiceBookingMeta(service);
  const { dateLabel } = getScheduleLabels(scheduledAt, timezone);
  const [reason, setReason] = useState("schedule");

  return (
    <div className={styles.customerHomeCancelOverlay} role="dialog" aria-modal="true">
      <Button
        className={styles.customerHomeCancelBackdrop}
        type="button"
        aria-label="Close cancellation"
        onClick={onClose}
        unstyled
      />
      <div className={styles.customerHomeCancelCard}>
        <div className={styles.customerHomeCancelHeader}>
          <h2 className={styles.customerHomeCancelTitle}>Cancel Appointment</h2>
          <Button
            className={styles.customerHomeCancelClose}
            type="button"
            aria-label="Close"
            onClick={onClose}
            unstyled
          >
            ×
          </Button>
        </div>

        <div className={styles.customerHomeCancelSection}>
          <h3 className={styles.customerHomeCancelSectionTitle}>Appointment Details</h3>
          <div className={styles.customerHomeCancelCardBox}>
            <div className={styles.customerHomeCancelCardTop}>
              <div>
                <p className={styles.customerHomeCancelService}>
                  {bookingMeta.name || service?.title}
                </p>
                <p className={styles.customerHomeCancelDesc}>
                  Our assessment let us examine your conditions before further treatment
                </p>
              </div>
              {bookingMeta.duration && (
                <span className={styles.customerHomeCancelDuration}>{bookingMeta.duration}</span>
              )}
            </div>
            <div className={styles.customerHomeCancelCardBottom}>
              <span>{dateLabel}</span>
              <span className={styles.customerHomeCancelPrice}>
                {bookingMeta.price || "N15,000"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.customerHomeCancelSection}>
          <h3 className={styles.customerHomeCancelSectionTitle}>Reason for Cancellation</h3>
          <div className={styles.customerHomeCancelReasons}>
            {[
              { id: "schedule", label: "Schedule conflict" },
              { id: "better", label: "Feeling better" },
              { id: "transport", label: "Transportation Issues" },
              { id: "other", label: "Other reason" },
            ].map((option) => (
              <label key={option.id} className={styles.customerHomeCancelReason}>
                <input
                  type="radio"
                  name="cancel-reason"
                  value={option.id}
                  checked={reason === option.id}
                  onChange={() => setReason(option.id)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <div className={styles.customerHomeCancelNote}>
            Please note: Cancellations less than 24 hours before your appointment may incur a
            fee.
          </div>
        </div>

        <Button
          className={styles.customerHomeCancelSubmit}
          type="button"
          onClick={onConfirm}
          unstyled
        >
          Confirm Cancellation
        </Button>
      </div>
    </div>
  );
};

const CancelledSuccess = ({ service, scheduledAt, timezone, onClose, onReschedule }) => {
  const bookingMeta = getServiceBookingMeta(service);
  const { dateLabel, timeLabel } = getScheduleLabels(scheduledAt, timezone);
  const hasSchedule = Boolean(scheduledAt);

  return (
    <div className={styles.customerHomeCancelSuccessOverlay} role="dialog" aria-modal="true">
      <div className={styles.customerHomeCancelSuccessCard}>
        <div className={styles.customerHomeCancelSuccessIcon}>
          <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor">
            <circle cx="24" cy="24" r="18" strokeWidth="2.5" />
            <path d="M16 24l6 6 10-12" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className={styles.customerHomeCancelSuccessTitle}>Appointment Cancelled</h2>
        <p className={styles.customerHomeCancelSuccessDesc}>
          {hasSchedule ? (
            <>
              Your appointment for {bookingMeta.name || service?.title} on {dateLabel}
              {timeLabel ? ` at ${timeLabel}` : ""} has been successfully cancelled.
            </>
          ) : (
            <>Your appointment for {bookingMeta.name || service?.title} has been successfully cancelled.</>
          )}
        </p>
        <div className={styles.customerHomeCancelSuccessActions}>
          <Button
            className={styles.customerHomeCancelSuccessPrimary}
            type="button"
            onClick={onClose}
            unstyled
          >
            Return to Home
          </Button>
          <Button
            className={styles.customerHomeCancelSuccessGhost}
            type="button"
            onClick={onReschedule}
            unstyled
          >
            Reschedule Appointment
          </Button>
        </div>
      </div>
    </div>
  );
};

const CustomersHome = () => {
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const { content, bookingPayload, bookingLoading, bookingError, myServices } = useSelector(
    (state) => state.customer
  );
  const getTenantId = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (token && getTenantId?.tenantId) {
      dispatch(getOnlineEcommerceStore({ token, tenant_id: getTenantId.tenantId }));
    }
  }, [dispatch, token, getTenantId?.tenantId]);

  // useEffect(() => {
  //   if (token) {
  //     dispatch(getServiceAvailability({ token }))
  //   }
  // }, [token, dispatch])
  const storeData = content?.data?.store;
  const storeName = storeData?.store_name || "Awesome Store";
  const storeLogo = storeData?.profile_logo_url || storeAvatar;
  const storeDescription = storeData?.store_description;
  const resolvedTenantId = getTenantId?.tenantId ?? null;
  const socialLinks = storeData?.social_links ?? EMPTY_ARRAY;
  const servicesPayload = myServices?.data?.services ?? EMPTY_ARRAY;
  const servicesPagination = myServices?.data?.pagination ?? {};
  const productCollectionItems = content?.data?.product_collections?.items ?? EMPTY_ARRAY;
  const productsNotInCollections = content?.data?.products_not_in_collections?.items ?? EMPTY_ARRAY;

  const serviceItems = useMemo(() => {
    const sortedServices = [...servicesPayload].sort(
      (a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0)
    );

    return sortedServices.map((service, index) => {
      const durationLabel = formatDuration(service.duration_minutes);
      const priceLabel = formatNaira(service.price);
      const titleBase = service.service_title || service.title || "Service";
      return {
        id: service.id || `service-${index}`,
        title: `${titleBase}${durationLabel ? ` (${durationLabel})` : ""}${
          priceLabel ? ` - ${priceLabel}` : ""
        }`,
        cta: "Book Now",
        price: service.price ?? null,
        image: getServiceImage(service.service_image_url, index),
        description: service.description || "Service details available on request.",
        time: durationLabel ? `Duration ${durationLabel}` : "Schedule on request",
        locationType: service.location_type,
        availability: service.availability,
      };
    });
  }, [servicesPayload]);

  const productCollectionsView = useMemo(() => {
    const mappedCollections = [];
    const sortedCollections = [...productCollectionItems].sort(
      (a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0)
    );

    sortedCollections.forEach((collection, collectionIndex) => {
      const entries = [...(collection?.StoreCollectionProducts || [])].sort(
        (a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0)
      );
      const products = entries.map((entry, index) => {
        const product = entry?.Product || entry?.product || entry || {};
        const priceLabel = formatNaira(product.price) || "Contact for price";
        return {
          id: product.id || entry.id || `${collection?.id || "collection"}-${index}`,
          title: product.name || product.title || "Product",
          description: product.category || product.description || "New arrival",
          price: priceLabel,
          image:
            product.image_url ||
            product.image ||
            fallbackProductImages[index % fallbackProductImages.length],
          pinned: Boolean(entry?.is_pinned),
        };
      });
      const previewImages = products
        .map((product) => product.image)
        .filter(Boolean)
        .slice(0, 3);
      mappedCollections.push({
        id: collection.id || `collection-${collectionIndex}`,
        title: collection.collection_name || "Collection",
        count: `${products.length} Product${products.length === 1 ? "" : "s"}`,
        images: previewImages.length ? previewImages : fallbackProductImages.slice(0, 3),
        products,
      });
    });

    if (productsNotInCollections.length) {
      const products = productsNotInCollections.map((entry, index) => {
        const product = entry?.Product || entry?.product || entry || {};
        const priceLabel = formatNaira(product.price) || "Contact for price";
        return {
          id: product.id || entry.id || `product-${index}`,
          title: product.name || product.title || "Product",
          description: product.category || product.description || "New arrival",
          price: priceLabel,
          image:
            product.image_url ||
            product.image ||
            fallbackProductImages[index % fallbackProductImages.length],
          pinned: Boolean(entry?.is_pinned),
        };
      });
      const previewImages = products
        .map((product) => product.image)
        .filter(Boolean)
        .slice(0, 3);
      mappedCollections.unshift({
        id: "unassigned-products",
        title: "Products",
        count: `${products.length} Product${products.length === 1 ? "" : "s"}`,
        images: previewImages.length ? previewImages : fallbackProductImages.slice(0, 3),
        products,
      });
    }

    return mappedCollections;
  }, [productCollectionItems, productsNotInCollections]);

  const [activeTab, setActiveTab] = useState("services");
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeService, setActiveService] = useState(null);
  const [bookingService, setBookingService] = useState(null);
  const [servicesPage, setServicesPage] = useState(1);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTimeSlot, setBookingTimeSlot] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const totalServicePages = Math.max(1, Number(servicesPagination?.total_pages) || 1);
  const paginationPage = Number(servicesPagination?.page) || servicesPage;
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelledBooking, setCancelledBooking] = useState(null);
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState("paystack");
  const bookingMetadata = bookingPayload?.metadata || {};
  const items = useMemo(
    () => (activeTab === "services" ? serviceItems : productCollectionsView),
    [activeTab, serviceItems, productCollectionsView]
  );
  const sectionTitle =
    activeTab === "services" ? "My Service Collections" : "Sales Collection";
  const isDetailView = activeTab === "shop" && (selectedCollection || selectedProduct);
  const bookingMeta = getServiceBookingMeta(bookingService);
  const bookingAmount = bookingPayload?.amount ?? parseAmount(bookingMeta.price);
  const bookingAmountLabel =
    bookingAmount !== null && bookingAmount !== undefined
      ? formatNaira(bookingAmount)
      : bookingMeta.price || "N15,000";
  const defaultTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lagos",
    []
  );
  const serviceAvailability = useMemo(
    () => normalizeAvailability(bookingService?.availability),
    [bookingService]
  );
  const availableDays = useMemo(
    () =>
      Object.entries(serviceAvailability)
        .filter(([, value]) => value?.available)
        .map(([day]) => day),
    [serviceAvailability]
  );
  const hasAvailability = Object.keys(serviceAvailability).length > 0;
  const selectedDayKey = bookingDate ? getWeekdayKeyFromDate(bookingDate) : "";
  const selectedDayAvailability = selectedDayKey ? serviceAvailability?.[selectedDayKey] : null;
  const availableTimeSlots = selectedDayAvailability?.available
    ? selectedDayAvailability?.time_slots || []
    : [];
  const isScheduleValid = Boolean(
    bookingDate &&
      bookingTimeSlot &&
      (!hasAvailability ||
        (selectedDayAvailability?.available && availableTimeSlots.includes(bookingTimeSlot)))
  );

  const shareOptions = useMemo(
    () =>
      socialLinks
        .filter((link) => link?.url)
        .map((link, index) => ({
          id: `${link.platform || "social"}-${index}`,
          label: formatPlatformLabel(link.platform),
          className: getSocialClassName(link.platform, styles),
          icon: getSocialIcon(link.platform),
          url: link.url,
        })),
    [socialLinks]
  );

  useEffect(() => {
    if (resolvedTenantId && activeTab === "services") {
      dispatch(
        getServices({
          tenant_id: resolvedTenantId,
          page: servicesPage,
          limit: SERVICES_PAGE_LIMIT,
          token,
        })
      );
    }
  }, [dispatch, resolvedTenantId, servicesPage, activeTab, token]);

  useEffect(() => {
    setServicesPage(1);
  }, [resolvedTenantId]);

  useEffect(() => {
    if (servicesPage > totalServicePages) {
      setServicesPage(totalServicePages);
    }
  }, [servicesPage, totalServicePages]);

  useEffect(() => {
    if (resolvedTenantId) {
      dispatch(updateBookingField({ field: "tenant_id", value: resolvedTenantId }));
    }
  }, [dispatch, resolvedTenantId]);

  useEffect(() => {
    if (!bookingPayload?.callback_url) {
      dispatch(updateBookingField({ field: "callback_url", value: "https://mycroshop.com" }));
    }
  }, [dispatch, bookingPayload?.callback_url]);

  useEffect(() => {
    if (!bookingMetadata?.timezone) {
      dispatch(updateBookingMetadataField({ field: "timezone", value: defaultTimeZone }));
    }
  }, [dispatch, bookingMetadata?.timezone, defaultTimeZone]);

  useEffect(() => {
    if (!bookingService) return;
    const amountValue = parseAmount(bookingService?.price ?? bookingMeta.price);
    if (amountValue !== null) {
      dispatch(updateBookingField({ field: "amount", value: amountValue }));
    }
    dispatch(updateBookingMetadataField({ field: "service_id", value: bookingService.id ?? "" }));
    dispatch(updateBookingMetadataField({ field: "booking_type", value: "service" }));
    dispatch(updateBookingMetadataField({ field: "is_booking", value: true }));
    if (bookingService?.locationType) {
      dispatch(
        updateBookingMetadataField({
          field: "location_type",
          value: bookingService.locationType,
        })
      );
    }
  }, [dispatch, bookingService, bookingMeta.price]);

  useEffect(() => {
    if (!bookingService) {
      setBookingDate("");
      setBookingTimeSlot("");
      setAvailabilityError("");
      return;
    }
    if (bookingMetadata?.scheduled_at) {
      setBookingDate(toDateInputValue(bookingMetadata.scheduled_at));
      setBookingTimeSlot(toTimeInputValue(bookingMetadata.scheduled_at));
    } else {
      setBookingDate("");
      setBookingTimeSlot("");
    }
  }, [bookingService, bookingMetadata?.scheduled_at]);

  useEffect(() => {
    if (!bookingDate || !bookingTimeSlot) {
      dispatch(updateBookingMetadataField({ field: "scheduled_at", value: "" }));
      return;
    }
    const isoValue = new Date(`${bookingDate}T${bookingTimeSlot}`).toISOString();
    dispatch(updateBookingMetadataField({ field: "scheduled_at", value: isoValue }));
  }, [dispatch, bookingDate, bookingTimeSlot]);

  useEffect(() => {
    if (!hasAvailability || !bookingDate) {
      setAvailabilityError("");
      return;
    }
    if (!selectedDayAvailability?.available) {
      setAvailabilityError("Selected day is not available for this service.");
      return;
    }
    setAvailabilityError("");
  }, [bookingDate, selectedDayAvailability]);

  const handleBookService = async () => {
    if (!bookingService) return;
    const amountValue = parseAmount(bookingService?.price ?? bookingMeta.price);
    const payload = {
      ...bookingPayload,
      amount: bookingPayload?.amount ?? amountValue ?? 0,
      email: bookingPayload?.email || bookingMetadata?.customer_email || "",
      tenant_id: bookingPayload?.tenant_id || resolvedTenantId,
      callback_url: bookingPayload?.callback_url || "https://mycroshop.com",
      metadata: {
        ...bookingMetadata,
        is_booking: true,
        booking_type: "service",
        service_id: bookingMetadata?.service_id || bookingService.id || "",
        scheduled_at: bookingMetadata?.scheduled_at || "",
        customer_name: bookingMetadata?.customer_name || "",
        customer_email: bookingMetadata?.customer_email || "",
        customer_phone: bookingMetadata?.customer_phone || "",
        timezone: bookingMetadata?.timezone || defaultTimeZone,
        location_type: bookingMetadata?.location_type || "in_person",
        notes: bookingMetadata?.notes || null,
      },
    };

    console.log("Booking payload:", payload);
    dispatch(setBookingPayload(payload));
    const result = await dispatch(bookService({ payload, token }));
    if (bookService.fulfilled.match(result)) {
      setConfirmedBooking({
        service: bookingService,
        scheduledAt: payload.metadata.scheduled_at,
        timezone: payload.metadata.timezone,
        locationType: payload.metadata.location_type,
      });
      setBookingService(null);
    }
  };

  const resetBookingSchedule = () => {
    dispatch(updateBookingMetadataField({ field: "scheduled_at", value: "" }));
    setBookingDate("");
    setBookingTimeSlot("");
    setAvailabilityError("");
  };

  return (
    <div className={styles.customerHomePage}>
      <div
        className={`${styles.customerHomeContent} ${
          isDetailView ? styles.customerHomeContentDetail : ""
        }`}
      >
        {!isDetailView && (
          <section className={styles.customerHomeProfile}>
            <img className={styles.customerHomeAvatar} src={storeLogo} alt={storeName} />
            <h1 className={styles.customerHomeTitle}>{storeName}</h1>
            <p className={styles.customerHomeSubtitle}>
              {storeDescription ? (
                storeDescription
              ) : (
                <>
                  Welcome to my store! Check out my latest <br /> products and exclusive deals.
                </>
              )}
            </p>
          </section>
        )}

        {!isDetailView && (
          <div className={styles.customerHomeSegment} role="tablist" aria-label="Store sections">
            <Button
              className={`${styles.customerHomeSegmentButton} ${
                activeTab === "services" ? styles.customerHomeSegmentActive : ""
              }`}
              type="button"
              role="tab"
              aria-selected={activeTab === "services"}
              onClick={() => {
                setActiveTab("services");
                setSelectedCollection(null);
                setSelectedProduct(null);
                setActiveService(null);
                setBookingService(null);
                resetBookingSchedule();
              }}
              unstyled
            >
              Services
            </Button>
            <Button
              className={`${styles.customerHomeSegmentButton} ${
                activeTab === "shop" ? styles.customerHomeSegmentActive : ""
              }`}
              type="button"
              role="tab"
              aria-selected={activeTab === "shop"}
              onClick={() => {
                setActiveTab("shop");
                setActiveService(null);
                setBookingService(null);
                resetBookingSchedule();
              }}
              unstyled
            >
              Shop
            </Button>
          </div>
        )}

        <div
          className={`${styles.customerHomeScrollable} ${
            isDetailView ? styles.customerHomeScrollableDetail : ""
          }`}
        >
          {activeTab === "services" ? (
            <>
              <h2 className={styles.customerHomeSectionTitle}>{sectionTitle}</h2>

              {items.length ? (
                <div className={styles.customerHomeServiceList}>
                  {items.map((item, index) => (
                    <Button
                      className={styles.customerHomeServiceCard}
                      key={`${item.id ?? item.title ?? "service"}-${index}`}
                      type="button"
                      onClick={() => setActiveService(item)}
                      unstyled
                    >
                      <img
                        className={styles.customerHomeServiceImage}
                        src={item.image}
                        alt={item.title}
                      />
                      <div className={styles.customerHomeServiceText}>
                        <span className={`${styles.customerHomeServiceTitle}`}>{item.title}</span>
                        <span className={styles.customerHomeServiceCta}>{item.cta}</span>
                      </div>
                      <span className={styles.customerHomeServiceMenu} aria-hidden="true">
                        ...
                      </span>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className={styles.customerHomeEmptyState}>
                  <p className={styles.customerHomeEmptyTitle}>No services available</p>
                  <p className={styles.customerHomeEmptyText}>
                    Please check back soon for updated offerings.
                  </p>
                </div>
              )}
              <div className={styles.customerHomePagination}>
                <span className={styles.customerHomePaginationMeta}>
                  Page {paginationPage} of {totalServicePages}
                </span>
                <div className={styles.customerHomePaginationControls}>
                  <Button
                    className={styles.customerHomePaginationButton}
                    type="button"
                    onClick={() => setServicesPage((prev) => Math.max(1, prev - 1))}
                    disabled={paginationPage <= 1}
                    unstyled
                  >
                    Previous
                  </Button>
                  <Button
                    className={styles.customerHomePaginationButton}
                    type="button"
                    onClick={() =>
                      setServicesPage((prev) => Math.min(totalServicePages, prev + 1))
                    }
                    disabled={paginationPage >= totalServicePages}
                    unstyled
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : selectedProduct ? (
            <ProductDetailView
              product={selectedProduct}
              onBack={() => setSelectedProduct(null)}
              storeName={storeName}
            />
          ) : selectedCollection ? (
            <CollectionDetailView
              collection={selectedCollection}
              onBack={() => setSelectedCollection(null)}
              onSelectProduct={(product) => setSelectedProduct(product)}
              storeLogo={storeLogo}
              storeName={storeName}
            />
          ) : (
            <div className={styles.customerHomeCollections}>
              {productCollectionsView.length ? (
                productCollectionsView.map((collection) => (
                  <Button
                    className={styles.customerHomeCollectionBlock}
                    key={collection.id || collection.title}
                    type="button"
                    onClick={() => setSelectedCollection(collection)}
                    unstyled
                  >
                    <h2 className={styles.customerHomeSectionTitle}>{collection.title}</h2>
                    <div className={styles.customerHomeCollectionCard}>
                      <div className={styles.customerHomeCollectionImages}>
                        {collection.images.map((image, index) => (
                          <div
                            className={styles.customerHomeCollectionImageWrap}
                            key={image + index}
                          >
                            <img
                              className={styles.customerHomeCollectionImage}
                              src={image}
                              alt={`${collection.title} ${index + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                      <div className={styles.customerHomeCollectionCount}>{collection.count}</div>
                    </div>
                  </Button>
                ))
              ) : (
                <div className={styles.customerHomeEmptyState}>
                  <p className={styles.customerHomeEmptyTitle}>No products available</p>
                  <p className={styles.customerHomeEmptyText}>
                    Check back soon for new arrivals.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {activeService && activeTab === "services" && (
          <div className={styles.customerHomeServiceOverlay} role="dialog" aria-modal="true">
            <Button
              className={styles.customerHomeServiceBackdrop}
              type="button"
              aria-label="Close service"
              onClick={() => setActiveService(null)}
              unstyled
            />
            <div className={styles.customerHomeServiceSheet}>
              <div className={styles.customerHomeServiceSheetHeader}>
                <span className={styles.customerHomeServiceSheetTitle}>Service</span>
                <Button
                  className={styles.customerHomeServiceSheetClose}
                  type="button"
                  aria-label="Close"
                  onClick={() => setActiveService(null)}
                  unstyled
                >
                  ×
                </Button>
              </div>

              <div className={styles.customerHomeServiceSheetCard}>
                <h3 className={styles.customerHomeServiceSheetHeading}>{activeService.title}</h3>
                <p className={styles.customerHomeServiceSheetDesc}>
                  {activeService.description}
                </p>
                <p className={styles.customerHomeServiceSheetTime}>{activeService.time}</p>
                <Button
                  className={styles.customerHomeServiceSheetAction}
                  type="button"
                  onClick={() => {
                    setBookingService(activeService);
                    resetBookingSchedule();
                    setActiveService(null);
                  }}
                  unstyled
                >
                  Book Now
                </Button>
              </div>

              {shareOptions.length > 0 && (
                <div className={styles.customerHomeShareRow}>
                  {shareOptions.map((option) => (
                    <a
                      key={option.id}
                      className={`${styles.customerHomeShareButton} ${option.className}`}
                      href={option.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={option.label}
                    >
                      <span className={styles.customerHomeShareIcon}>{option.icon}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {bookingService && (
          <div className={styles.customerHomeBookingOverlay} role="dialog" aria-modal="true">
            <Button
              className={styles.customerHomeBookingBackdrop}
              type="button"
              aria-label="Close booking form"
              onClick={() => {
                setBookingService(null);
                resetBookingSchedule();
              }}
              unstyled
            />
            <div className={styles.customerHomeBookingSheet}>
              <div className={styles.customerHomeBookingHeader}>
                <span className={styles.customerHomeBookingTitle}>Bookings</span>
                <Button
                  className={styles.customerHomeBookingClose}
                  type="button"
                  aria-label="Close"
                  onClick={() => {
                    setBookingService(null);
                    resetBookingSchedule();
                  }}
                  unstyled
                >
                  ×
                </Button>
              </div>

              <div className={styles.customerHomeBookingSection}>
                <h3 className={styles.customerHomeBookingSectionTitle}>Booking Details</h3>
                <div className={styles.customerHomeBookingCard}>
                  <div className={styles.customerHomeBookingCardTop}>
                    <span className={styles.customerHomeBookingCardName}>
                      {bookingMeta.name || bookingService.title}
                    </span>
                    {bookingMeta.duration && (
                      <span className={styles.customerHomeBookingDuration}>
                        {bookingMeta.duration}
                      </span>
                    )}
                  </div>
                  <p className={`text-start ${styles.customerHomeBookingCardDesc}`}>
                    {bookingService.description}
                  </p>
                  <div className={styles.customerHomeBookingCardMeta}>
                    <span className={styles.customerHomeBookingCardTime}>
                      {bookingService.time}
                    </span>
                    {bookingMeta.price && (
                      <span className={styles.customerHomeBookingPrice}>
                        {bookingMeta.price}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.customerHomeBookingSection}>
                <h3 className={styles.customerHomeBookingSectionTitle}>Availability</h3>
                <div className={styles.customerHomeAvailability}>
                  {availableDays.length ? (
                    Object.entries(serviceAvailability).map(([day, details]) => {
                      if (!details?.available) {
                        return (
                          <div key={day} className={styles.customerHomeAvailabilityRow}>
                            <span className={styles.customerHomeAvailabilityDay}>{day}</span>
                            <span className={styles.customerHomeAvailabilityStatus}>Unavailable</span>
                          </div>
                        );
                      }
                      const slots = details?.time_slots || [];
                      return (
                        <div key={day} className={styles.customerHomeAvailabilityRow}>
                          <span className={styles.customerHomeAvailabilityDay}>{day}</span>
                          <div className={styles.customerHomeAvailabilitySlots}>
                            {slots.length ? (
                              slots.map((slot) => (
                                <span
                                  key={`${day}-${slot}`}
                                  className={styles.customerHomeAvailabilitySlot}
                                >
                                  {slot}
                                </span>
                              ))
                            ) : (
                              <span className={styles.customerHomeAvailabilityStatus}>
                                No time slots
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className={styles.customerHomeAvailabilityEmpty}>
                      Availability not provided for this service.
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.customerHomeBookingSection}>
                <h3 className={styles.customerHomeBookingSectionTitle}>Schedule</h3>
                <label className={styles.customerHomeBookingInputLabel}>
                  Date <span className={styles.customerHomeBookingRequired}>*</span>
                  <div className={styles.customerHomeBookingInputWrap}>
                    <input
                      className={styles.customerHomeBookingInput}
                      type="date"
                      value={bookingDate}
                      onChange={(event) => {
                        const value = event.target.value;
                        setBookingDate(value);
                        setBookingTimeSlot("");
                        if (hasAvailability) {
                          const dayKey = getWeekdayKeyFromDate(value);
                          if (!serviceAvailability?.[dayKey]?.available) {
                            setAvailabilityError("Selected day is not available for this service.");
                          }
                        }
                      }}
                    />
                  </div>
                </label>
                <label className={styles.customerHomeBookingInputLabel}>
                  Time <span className={styles.customerHomeBookingRequired}>*</span>
                  <div className={styles.customerHomeBookingInputWrap}>
                    {hasAvailability ? (
                      <>
                        <select
                          className={styles.customerHomeBookingSelect}
                          value={bookingTimeSlot}
                          onChange={(event) => setBookingTimeSlot(event.target.value)}
                          disabled={!selectedDayAvailability?.available}
                        >
                          <option value="" disabled>
                            Select Time
                          </option>
                          {availableTimeSlots.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        <span className={styles.customerHomeBookingSelectIcon}>▾</span>
                      </>
                    ) : (
                      <input
                        className={styles.customerHomeBookingInput}
                        type="time"
                        value={bookingTimeSlot}
                        onChange={(event) => setBookingTimeSlot(event.target.value)}
                      />
                    )}
                  </div>
                </label>
                {availabilityError && (
                  <p className={styles.customerHomeBookingSubtle}>{availabilityError}</p>
                )}
                <label className={styles.customerHomeBookingInputLabel}>
                  Timezone <span className={styles.customerHomeBookingRequired}>*</span>
                  <div className={styles.customerHomeBookingInputWrap}>
                    <input
                      className={styles.customerHomeBookingInput}
                      type="text"
                      placeholder="Africa/Lagos"
                      value={bookingMetadata.timezone || ""}
                      onChange={(event) =>
                        dispatch(
                          updateBookingMetadataField({
                            field: "timezone",
                            value: event.target.value,
                          })
                        )
                      }
                    />
                  </div>
                </label>
                <label className={styles.customerHomeBookingInputLabel}>
                  Location Type <span className={styles.customerHomeBookingRequired}>*</span>
                  <div className={styles.customerHomeBookingInputWrap}>
                    <select
                      className={styles.customerHomeBookingSelect}
                      value={bookingMetadata.location_type || "in_person"}
                      onChange={(event) =>
                        dispatch(
                          updateBookingMetadataField({
                            field: "location_type",
                            value: event.target.value,
                          })
                        )
                      }
                    >
                      <option value="in_person">In-person</option>
                      <option value="virtual">Virtual</option>
                    </select>
                    <span className={styles.customerHomeBookingSelectIcon}>▾</span>
                  </div>
                </label>
              </div>

              <div className={styles.customerHomeBookingSection}>
                <h3 className={styles.customerHomeBookingSectionTitle}>Customer Details</h3>
                <label className={styles.customerHomeBookingInputLabel}>
                  Full Name <span className={styles.customerHomeBookingRequired}>*</span>
                  <div className={styles.customerHomeBookingInputWrap}>
                    <input
                      className={styles.customerHomeBookingInput}
                      type="text"
                      placeholder="Customer name"
                      value={bookingMetadata.customer_name || ""}
                      onChange={(event) =>
                        dispatch(
                          updateBookingMetadataField({
                            field: "customer_name",
                            value: event.target.value,
                          })
                        )
                      }
                    />
                  </div>
                </label>
                <label className={styles.customerHomeBookingInputLabel}>
                  Email <span className={styles.customerHomeBookingRequired}>*</span>
                  <div className={styles.customerHomeBookingInputWrap}>
                    <input
                      className={styles.customerHomeBookingInput}
                      type="email"
                      placeholder="Email"
                      value={bookingMetadata.customer_email || ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        dispatch(
                          updateBookingMetadataField({
                            field: "customer_email",
                            value,
                          })
                        );
                        dispatch(updateBookingField({ field: "email", value }));
                      }}
                    />
                  </div>
                </label>
                <label className={styles.customerHomeBookingInputLabel}>
                  Mobile Phone <span className={styles.customerHomeBookingRequired}>*</span>
                  <div className={styles.customerHomeBookingInputWrap}>
                    <input
                      className={styles.customerHomeBookingInput}
                      type="tel"
                      placeholder="+2348012345678"
                      value={bookingMetadata.customer_phone || ""}
                      onChange={(event) =>
                        dispatch(
                          updateBookingMetadataField({
                            field: "customer_phone",
                            value: event.target.value,
                          })
                        )
                      }
                    />
                  </div>
                </label>
                <label className={styles.customerHomeBookingInputLabel}>
                  Notes
                  <div className={styles.customerHomeBookingInputWrap}>
                    <textarea
                      className={styles.customerHomeBookingInput}
                      placeholder="Additional notes (optional)"
                      rows={3}
                      value={bookingMetadata.notes || ""}
                      onChange={(event) =>
                        dispatch(
                          updateBookingMetadataField({
                            field: "notes",
                            value: event.target.value,
                          })
                        )
                      }
                    />
                  </div>
                </label>
              </div>

              <div className={styles.customerHomeBookingSection}>
                <h3 className={styles.customerHomeBookingSectionTitle}>Payment</h3>
                <p className={styles.customerHomeBookingSubtle}>
                  Select a payment method
                </p>
                <div className={styles.customerHomeBookingTotalRow}>
                  <span>Total</span>
                  <span>{bookingAmountLabel}</span>
                </div>
                <p className={styles.customerHomeBookingSubtle}>
                  Select a payment method
                </p>
                <div className={styles.customerHomeBookingPaymentOptions}>
                  <Button
                    className={`${styles.customerHomeBookingPaymentButton} ${
                      bookingPaymentMethod === "paystack"
                        ? styles.customerHomeBookingPaymentActive
                        : ""
                    }`}
                    type="button"
                    onClick={() => setBookingPaymentMethod("paystack")}
                    unstyled
                  >
                    <span className={styles.customerHomeBookingPaymentDot} aria-hidden="true" />
                    <img
                      className={styles.customerHomeBookingPaymentLogo}
                      src="https://upload.wikimedia.org/wikipedia/commons/f/f9/Paystack_Logo.svg"
                      alt="Paystack"
                      loading="lazy"
                    />
                  </Button>
                  <Button
                    className={`${styles.customerHomeBookingPaymentButton} ${
                      bookingPaymentMethod === "flutterwave"
                        ? styles.customerHomeBookingPaymentActive
                        : ""
                    }`}
                    type="button"
                    onClick={() => setBookingPaymentMethod("flutterwave")}
                    unstyled
                  >
                    <span className={styles.customerHomeBookingPaymentDot} aria-hidden="true" />
                    <img
                      className={styles.customerHomeBookingPaymentLogo}
                      src="https://upload.wikimedia.org/wikipedia/commons/9/9e/Flutterwave_Logo.png"
                      alt="Flutterwave"
                      loading="lazy"
                    />
                  </Button>
                </div>
                {bookingError && (
                  <p className={styles.customerHomeBookingSubtle}>
                    {typeof bookingError === "string"
                      ? bookingError
                      : bookingError?.message || "Unable to book this service right now."}
                  </p>
                )}
                <Button
                  className={styles.customerHomeBookingSubmit}
                  type="button"
                  onClick={handleBookService}
                  disabled={bookingLoading || !isScheduleValid}
                  unstyled
                >
                  {bookingLoading ? "Booking..." : "Pay and Book Appointment"}
                </Button>
                <p className={styles.customerHomeBookingFinePrint}>
                  By clicking on any of the payment methods, you agree to make your
                  purchase from {storeName} as merchant of record for this transaction.
                </p>
              </div>
            </div>
          </div>
        )}

        {confirmedBooking && (
          <BookingConfirmation
            service={confirmedBooking.service}
            scheduledAt={confirmedBooking.scheduledAt}
            timezone={confirmedBooking.timezone}
            locationType={confirmedBooking.locationType}
            onClose={() => setConfirmedBooking(null)}
            onCancel={() => {
              setCancelBooking(confirmedBooking);
              setConfirmedBooking(null);
            }}
          />
        )}

        {cancelBooking && (
          <CancelAppointment
            service={cancelBooking.service}
            scheduledAt={cancelBooking.scheduledAt}
            timezone={cancelBooking.timezone}
            onClose={() => setCancelBooking(null)}
            onConfirm={() => {
              setCancelledBooking(cancelBooking);
              setCancelBooking(null);
            }}
          />
        )}

        {cancelledBooking && (
          <CancelledSuccess
            service={cancelledBooking.service}
            scheduledAt={cancelledBooking.scheduledAt}
            timezone={cancelledBooking.timezone}
            onClose={() => {
              setActiveTab("services");
              setSelectedCollection(null);
              setSelectedProduct(null);
              setActiveService(null);
              setBookingService(null);
              resetBookingSchedule();
              setConfirmedBooking(null);
              setCancelBooking(null);
              setCancelledBooking(null);
            }}
            onReschedule={() => {
              setBookingService(cancelledBooking.service);
              dispatch(
                updateBookingMetadataField({
                  field: "scheduled_at",
                  value: cancelledBooking.scheduledAt || "",
                })
              );
              dispatch(
                updateBookingMetadataField({
                  field: "timezone",
                  value: cancelledBooking.timezone || bookingMetadata.timezone || defaultTimeZone,
                })
              );
              dispatch(
                updateBookingMetadataField({
                  field: "location_type",
                  value: cancelledBooking.locationType || bookingMetadata.location_type || "in_person",
                })
              );
              setCancelledBooking(null);
            }}
          />
        )}

        {!isDetailView && (
          <footer className={styles.customerHomeFooter}>
            <div className={styles.customerHomeJoinCta}>
              <span className={styles.customerHomeJoinIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M4 20h16v2H4z" />
                  <path d="M6 10h3v8H6z" />
                  <path d="M11 6h3v12h-3z" />
                  <path d="M16 3h3v15h-3z" />
                </svg>
              </span>
              <span>Join awesomestore on Mycroshop</span>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default CustomersHome;
