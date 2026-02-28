import React, { useMemo, useState } from "react";
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

const services = [
  {
    title: "Home Massage (1hr) - N15,000",
    cta: "Book Now",
    image: serviceOne,
    description: "We give you full body massage at an exclusive deal",
    time: "08:00 AM to 02:00 PM",
  },
  {
    title: "Full Body Massage (1hr) - N12,000",
    cta: "Book Now",
    image: serviceTwo,
    description: "Relaxing massage session tailored to your needs",
    time: "09:00 AM to 04:00 PM",
  },
  {
    title: "Deep Pore Facial (45min) - N8,000",
    cta: "Book Now",
    image: serviceThree,
    description: "Deep cleansing facial to refresh your skin",
    time: "10:00 AM to 05:00 PM",
  },
];

const collections = [
  {
    title: "Sales Collection",
    count: "8 Products",
    images: [productOne, productTwo, productThree],
    products: [
      {
        title: "High Sophisticated & Seductive Heels",
        description: "Latest design from Lulu collections",
        price: "N29.99",
        image: productTwo,
        pinned: true,
      },
      {
        title: "Italian Creamy Quality High Heel",
        description: "High quality heal that meets any occasion.",
        price: "N125.09",
        image: productOne,
        pinned: true,
      },
      {
        title: "Gavini Allanwood Quality High Heel",
        description: "Latest design from Lulu collections",
        price: "N29.99",
        image: productFour,
      },
      {
        title: "Italian Creamy Quality High Heel",
        description: "High quality heal that meets any occasion.",
        price: "N125.09",
        image: productThree,
      },
      {
        title: "Gavini Allanwood Quality High Heel",
        description: "Latest design from Lulu collections",
        price: "N29.99",
        image: productSix,
      },
      {
        title: "Italian Creamy Quality High Heel",
        description: "High quality heal that meets any occasion.",
        price: "N125.09",
        image: productFive,
      },
    ],
  },
  {
    title: "New Collection",
    count: "2 Products",
    images: [productFour, productFive],
    products: [
      {
        title: "Cozy Knit Poncho",
        description: "Lightweight layers for cool evenings.",
        price: "N18.50",
        image: productFour,
      },
      {
        title: "Classic Plaid Overshirt",
        description: "Soft brushed cotton with relaxed fit.",
        price: "N22.00",
        image: productFive,
      },
    ],
  },
  {
    title: "Old Collection",
    count: "5 Products",
    images: [productSix, productOne, productTwo],
    products: [
      {
        title: "Signature Sandals",
        description: "Comfort footbed with polished straps.",
        price: "N15.20",
        image: productSix,
      },
      {
        title: "Leather Pointed Heels",
        description: "Sharp silhouette for evening wear.",
        price: "N34.90",
        image: productOne,
      },
      {
        title: "Muted Satin Pumps",
        description: "Elegant finish for formal settings.",
        price: "N29.99",
        image: productTwo,
      },
      {
        title: "Cream Lace-Up Boot",
        description: "Structured ankle support with grip.",
        price: "N41.10",
        image: productThree,
      },
      {
        title: "Everyday Block Heel",
        description: "Stable heel for long days.",
        price: "N24.75",
        image: productFive,
      },
    ],
  },
];

const bookingDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const bookingTimes = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
];

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

const CollectionDetailView = ({ collection, onBack, onSelectProduct }) => {
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
        <img className={styles.customerHomeMiniAvatar} src={storeAvatar} alt="Awesome Store" />
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
            key={product.title}
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

const ProductDetailView = ({ product, onBack }) => {
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
        <span className={styles.customerHomeProductHeaderTitle}>Awesome Store</span>
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

const BookingConfirmation = ({ service, bookingDay, bookingTime, onClose, onCancel }) => {
  const bookingMeta = getServiceBookingMeta(service);
  const displayDay = bookingDay || "To be scheduled";
  const displayTime = bookingTime || "To be scheduled";

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
                <span className={styles.customerHomeConfirmValue}>{displayDay}</span>
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
                <span className={styles.customerHomeConfirmValue}>{displayTime}</span>
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
                <span className={styles.customerHomeConfirmValue}>
                  27 Awolowo way Ikeja Lagos
                </span>
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

const CancelAppointment = ({ service, bookingDay, onClose, onConfirm }) => {
  const bookingMeta = getServiceBookingMeta(service);
  const displayDay = bookingDay || "To be scheduled";
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
              <span>{displayDay}</span>
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

const CancelledSuccess = ({ service, bookingDay, bookingTime, onClose, onReschedule }) => {
  const bookingMeta = getServiceBookingMeta(service);
  const hasSchedule = bookingDay && bookingTime;

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
              Your appointment for {bookingMeta.name || service?.title} on {bookingDay} at{" "}
              {bookingTime} has been successfully cancelled.
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
  const [activeTab, setActiveTab] = useState("services");
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeService, setActiveService] = useState(null);
  const [bookingService, setBookingService] = useState(null);
  const [bookingDay, setBookingDay] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelledBooking, setCancelledBooking] = useState(null);
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState("paystack");
  const items = useMemo(() => (activeTab === "services" ? services : collections), [activeTab]);
  const sectionTitle =
    activeTab === "services" ? "My Service Collections" : "Sales Collection";
  const isDetailView = activeTab === "shop" && (selectedCollection || selectedProduct);
  const bookingMeta = getServiceBookingMeta(bookingService);
  const shareOptions = [
    {
      label: "Copy link",
      className: styles.customerHomeShareLink,
      icon: (
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
      ),
    },
    {
      label: "X",
      className: styles.customerHomeShareX,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.9 3.5h2.6l-6 6.9 6.6 10.1h-5.1l-4-5.7-4.8 5.7H5l6.5-7.5L4.9 3.5H10l3.7 5.1 5.2-5.1z" />
        </svg>
      ),
    },
    {
      label: "Facebook",
      className: styles.customerHomeShareFacebook,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M13.5 9H16V6h-2.5C11.6 6 10 7.6 10 9.5V11H8v3h2v6h3v-6h2.3l.7-3H13V9.5c0-.3.2-.5.5-.5z" />
        </svg>
      ),
    },
    {
      label: "WhatsApp",
      className: styles.customerHomeShareWhatsApp,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            d="M20.52 3.49A11.86 11.86 0 0 0 12.01 0C5.4 0 .03 5.37.03 11.98c0 2.11.55 4.17 1.6 5.99L0 24l6.2-1.62a11.93 11.93 0 0 0 5.8 1.48h.01c6.6 0 11.98-5.37 11.98-11.98 0-3.2-1.25-6.21-3.47-8.39zM12 21.3h-.01a9.37 9.37 0 0 1-4.78-1.32l-.34-.2-3.68.96.98-3.58-.22-.37a9.33 9.33 0 0 1-1.44-5.02c0-5.14 4.19-9.33 9.34-9.33a9.28 9.28 0 0 1 6.6 2.74 9.28 9.28 0 0 1 2.73 6.59c0 5.14-4.19 9.33-9.33 9.33zm5.1-6.96c-.28-.14-1.64-.81-1.89-.9-.25-.09-.43-.14-.62.14-.19.28-.72.9-.88 1.08-.16.18-.32.2-.6.06-.28-.14-1.2-.44-2.29-1.41-.84-.75-1.4-1.67-1.56-1.95-.16-.28-.02-.44.12-.58.13-.13.28-.32.42-.48.14-.16.19-.28.28-.47.09-.19.05-.36-.02-.5-.07-.14-.62-1.5-.85-2.05-.23-.55-.47-.48-.65-.48h-.56c-.19 0-.5.07-.76.36-.26.28-1 1-1 2.3 0 1.3 1.02 2.56 1.16 2.74.14.19 2.01 3.06 4.87 4.3.68.29 1.2.46 1.61.59.68.22 1.29.19 1.78.11.54-.08 1.64-.68 1.87-1.35.23-.67.23-1.24.16-1.35-.07-.11-.26-.18-.54-.32z"
          />
        </svg>
      ),
    },
    {
      label: "LinkedIn",
      className: styles.customerHomeShareLinkedIn,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6.5 9H3.8v11h2.7V9zM5.1 4.2a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zM20.5 13.3c0-2.5-1.6-4.4-4-4.4-1.3 0-2.1.7-2.5 1.4V9h-2.6v11h2.6v-6c0-1.6.6-2.6 2-2.6 1.1 0 1.7.8 1.7 2.6v6h2.8v-6.7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className={styles.customerHomePage}>
      <div
        className={`${styles.customerHomeContent} ${
          isDetailView ? styles.customerHomeContentDetail : ""
        }`}
      >
        {!isDetailView && (
          <section className={styles.customerHomeProfile}>
            <img className={styles.customerHomeAvatar} src={storeAvatar} alt="Awesome Store" />
            <h1 className={styles.customerHomeTitle}>Awesome Store</h1>
            <p className={styles.customerHomeSubtitle}>
              Welcome to my store! Check out my latest <br /> products and exclusive deals.
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
                setBookingDay("");
                setBookingTime("");
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
                setBookingDay("");
                setBookingTime("");
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

              <div className={styles.customerHomeServiceList}>
                {items.map((item) => (
                  <Button
                    className={styles.customerHomeServiceCard}
                    key={item.title}
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
            </>
          ) : selectedProduct ? (
            <ProductDetailView
              product={selectedProduct}
              onBack={() => setSelectedProduct(null)}
            />
          ) : selectedCollection ? (
            <CollectionDetailView
              collection={selectedCollection}
              onBack={() => setSelectedCollection(null)}
              onSelectProduct={(product) => setSelectedProduct(product)}
            />
          ) : (
            <div className={styles.customerHomeCollections}>
              {collections.map((collection) => (
                <Button
                  className={styles.customerHomeCollectionBlock}
                  key={collection.title}
                  type="button"
                  onClick={() => setSelectedCollection(collection)}
                  unstyled
                >
                  <h2 className={styles.customerHomeSectionTitle}>{collection.title}</h2>
                  <div className={styles.customerHomeCollectionCard}>
                    <div className={styles.customerHomeCollectionImages}>
                      {collection.images.map((image, index) => (
                        <div className={styles.customerHomeCollectionImageWrap} key={image + index}>
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
              ))}
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
                    setBookingDay("");
                    setBookingTime("");
                    setActiveService(null);
                  }}
                  unstyled
                >
                  Book Now
                </Button>
              </div>

              <div className={styles.customerHomeShareRow}>
                {shareOptions.map((option) => (
                  <Button
                    key={option.label}
                    className={`${styles.customerHomeShareButton} ${option.className}`}
                    type="button"
                    aria-label={option.label}
                    unstyled
                  >
                    <span className={styles.customerHomeShareIcon}>{option.icon}</span>
                    <span className={styles.customerHomeShareLabel}>{option.label}</span>
                  </Button>
                ))}
              </div>
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
                setBookingDay("");
                setBookingTime("");
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
                    setBookingDay("");
                    setBookingTime("");
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
                <label className={styles.customerHomeBookingInputLabel}>
                  Day
                  <div className={styles.customerHomeBookingInputWrap}>
                    <select
                      className={styles.customerHomeBookingSelect}
                      value={bookingDay}
                      onChange={(event) => setBookingDay(event.target.value)}
                    >
                      <option value="" disabled>
                        Select Day
                      </option>
                      {bookingDays.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                    <span className={styles.customerHomeBookingSelectIcon}>▾</span>
                  </div>
                </label>
                <label className={styles.customerHomeBookingInputLabel}>
                  Time
                  <div className={styles.customerHomeBookingInputWrap}>
                    <select
                      className={styles.customerHomeBookingSelect}
                      value={bookingTime}
                      onChange={(event) => setBookingTime(event.target.value)}
                    >
                      <option value="" disabled>
                        Select Time
                      </option>
                      {bookingTimes.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    <span className={styles.customerHomeBookingSelectIcon}>▾</span>
                  </div>
                </label>
              </div>

              <div className={styles.customerHomeBookingSection}>
                <h3 className={styles.customerHomeBookingSectionTitle}>Customer Details</h3>
                <div className={styles.customerHomeBookingSplit}>
                  <label className={styles.customerHomeBookingInputLabel}>
                    First Name <span className={styles.customerHomeBookingRequired}>*</span>
                    <div className={styles.customerHomeBookingInputWrap}>
                      <input
                        className={styles.customerHomeBookingInput}
                        type="text"
                        placeholder="First Name"
                      />
                    </div>
                  </label>
                  <label className={styles.customerHomeBookingInputLabel}>
                    Last Name <span className={styles.customerHomeBookingRequired}>*</span>
                    <div className={styles.customerHomeBookingInputWrap}>
                      <input
                        className={styles.customerHomeBookingInput}
                        type="text"
                        placeholder="Last Name"
                      />
                    </div>
                  </label>
                </div>
                <label className={styles.customerHomeBookingInputLabel}>
                  Email <span className={styles.customerHomeBookingRequired}>*</span>
                  <div className={styles.customerHomeBookingInputWrap}>
                    <input
                      className={styles.customerHomeBookingInput}
                      type="email"
                      placeholder="Email"
                    />
                  </div>
                </label>
                <label className={styles.customerHomeBookingInputLabel}>
                  Address <span className={styles.customerHomeBookingRequired}>*</span>
                  <div className={styles.customerHomeBookingInputWrap}>
                    <input
                      className={styles.customerHomeBookingInput}
                      type="text"
                      placeholder="Shipping address"
                    />
                  </div>
                </label>
                <label className={styles.customerHomeBookingInputLabel}>
                  Country <span className={styles.customerHomeBookingRequired}>*</span>
                  <div className={styles.customerHomeBookingInputWrap}>
                    <input
                      className={styles.customerHomeBookingInput}
                      type="text"
                      placeholder="Country"
                    />
                  </div>
                </label>
                <label className={styles.customerHomeBookingInputLabel}>
                  State <span className={styles.customerHomeBookingRequired}>*</span>
                  <div className={styles.customerHomeBookingInputWrap}>
                    <input
                      className={styles.customerHomeBookingInput}
                      type="text"
                      placeholder="State"
                    />
                  </div>
                </label>
                <label className={styles.customerHomeBookingInputLabel}>
                  City / Town <span className={styles.customerHomeBookingRequired}>*</span>
                  <div className={styles.customerHomeBookingInputWrap}>
                    <input
                      className={styles.customerHomeBookingInput}
                      type="text"
                      placeholder="City / Town"
                    />
                  </div>
                </label>
                <label className={styles.customerHomeBookingInputLabel}>
                  Mobile Phone
                  <div className={styles.customerHomeBookingInputWrap}>
                    <input
                      className={styles.customerHomeBookingInput}
                      type="tel"
                      placeholder="Mobile Phone"
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
                  <span>{bookingMeta.price || "N15,000"}</span>
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
                <Button
                  className={styles.customerHomeBookingSubmit}
                  type="button"
                  onClick={() => {
                    setConfirmedBooking({
                      service: bookingService,
                      day: bookingDay,
                      time: bookingTime,
                    });
                    setBookingService(null);
                  }}
                  unstyled
                >
                  Pay and Book Appointment
                </Button>
                <p className={styles.customerHomeBookingFinePrint}>
                  By clicking on any of the payment methods, you agree to make your
                  purchase from Awesome Store as merchant of record for this transaction.
                </p>
              </div>
            </div>
          </div>
        )}

        {confirmedBooking && (
          <BookingConfirmation
            service={confirmedBooking.service}
            bookingDay={confirmedBooking.day}
            bookingTime={confirmedBooking.time}
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
            bookingDay={cancelBooking.day}
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
            bookingDay={cancelledBooking.day}
            bookingTime={cancelledBooking.time}
            onClose={() => {
              setActiveTab("services");
              setSelectedCollection(null);
              setSelectedProduct(null);
              setActiveService(null);
              setBookingService(null);
              setBookingDay("");
              setBookingTime("");
              setConfirmedBooking(null);
              setCancelBooking(null);
              setCancelledBooking(null);
            }}
            onReschedule={() => {
              setBookingService(cancelledBooking.service);
              setBookingDay(cancelledBooking.day || "");
              setBookingTime(cancelledBooking.time || "");
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
