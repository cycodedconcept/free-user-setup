import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  bookService,
  getOnlineEcommerceStore,
  setBookingPayload,
  updateBookingField,
  updateBookingMetadataField,
  getProductDetails,
} from "../../slice/customerFacingSlice";
import { getStorePreview } from "../../slice/onlineStoreSlice"
import { useDispatch, useSelector } from 'react-redux';
import Swal from "sweetalert2";
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
import { buildCustomerThemeStyle, writeStoredCustomerTheme } from "../customerTheme";

const EMPTY_ARRAY = [];
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DESCRIPTION_WORD_STEP = 50;
const FOOTER_DESCRIPTION_WORD_LIMIT = 30;

const fallbackServiceImages = [serviceOne, serviceTwo, serviceThree];
const fallbackProductImages = [productOne, productTwo, productThree, productFour, productFive, productSix];
const PENDING_BOOKING_KEY = "mycroshop.pendingBooking";
const SHOW_BOOKING_KEY = "mycroshop.showBookingConfirmation";
const PAYMENT_CONTEXT_KEY = "mycroshop.paymentContext";
const CART_KEY = "mycroshop.cart";
const CUSTOMER_LOGO_STORAGE_KEY = "mycroshop.customerProfileLogo";

const resolveStoreBannerImage = (storeData) =>
  storeData?.banner_image_url ||
  storeData?.banner_url ||
  storeData?.cover_image_url ||
  "";

const readStoredCustomerLogo = () => {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(CUSTOMER_LOGO_STORAGE_KEY) || "";
  } catch {
    return "";
  }
};

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
  } catch {
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

const parseIsoDateTimeParts = (isoValue) => {
  if (!isoValue) return null;
  const match = isoValue.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (!match) return null;
  return { datePart: match[1], timePart: match[2] };
};

const toDateInputValue = (isoValue) => {
  const parts = parseIsoDateTimeParts(isoValue);
  return parts ? parts.datePart : "";
};

const toTimeInputValue = (isoValue) => {
  const parts = parseIsoDateTimeParts(isoValue);
  return parts ? parts.timePart : "";
};

const createDateFromInputValue = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(year, month - 1, day);
};

const toDateOnly = (value) => {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const formatDateInputValue = (date) => {
  const normalized = toDateOnly(date);
  if (!normalized) return "";
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, "0");
  const day = String(normalized.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateDisplayValue = (value) => {
  const parsed = createDateFromInputValue(value);
  if (!parsed) return "";
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const shiftMonth = (date, offset) => {
  const normalized = toDateOnly(date);
  if (!normalized) return new Date();
  return new Date(normalized.getFullYear(), normalized.getMonth() + offset, 1);
};

const buildCalendarDays = (monthDate) => {
  const normalizedMonth = toDateOnly(monthDate) || new Date();
  const startOfMonth = new Date(normalizedMonth.getFullYear(), normalizedMonth.getMonth(), 1);
  const startWeekday = startOfMonth.getDay();
  const firstGridDate = new Date(
    startOfMonth.getFullYear(),
    startOfMonth.getMonth(),
    1 - startWeekday
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      firstGridDate.getFullYear(),
      firstGridDate.getMonth(),
      firstGridDate.getDate() + index
    );
    return {
      date,
      iso: formatDateInputValue(date),
      dayLabel: date.getDate(),
      isCurrentMonth: date.getMonth() === normalizedMonth.getMonth(),
    };
  });
};

const buildScheduledAt = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return "";
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return "";
  }
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0)).toISOString();
};

const getServiceImage = (imageUrl, fallbackIndex) => {
  if (!imageUrl) return fallbackServiceImages[fallbackIndex % fallbackServiceImages.length];
  const trimmed = imageUrl.toString().trim();
  if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") {
    return fallbackServiceImages[fallbackIndex % fallbackServiceImages.length];
  }
  return trimmed;
};

const sortByOrder = (items) =>
  [...(Array.isArray(items) ? items : EMPTY_ARRAY)].sort(
    (a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0)
  );

const buildServiceDisplayItem = (service, index) => {
  const durationLabel = formatDuration(service?.duration_minutes);
  const priceLabel = formatNaira(service?.price);
  const titleBase = service?.service_title || service?.title || "Service";

  return {
    id: service?.id || `service-${index}`,
    name: titleBase,
    title: `${titleBase}${durationLabel ? ` (${durationLabel})` : ""}${
      priceLabel ? ` - ${priceLabel}` : ""
    }`,
    cta: "Book Now",
    price: service?.price ?? null,
    priceLabel,
    duration: durationLabel,
    image: getServiceImage(service?.service_image_url, index),
    description: service?.description || "Service details available on request.",
    time: durationLabel ? `Duration ${durationLabel}` : "Schedule on request",
    locationType: service?.location_type,
    availability: service?.availability,
    category: service?.category || service?.service_category,
    raw: service,
  };
};

const resolveCollectionService = (entry) =>
  entry?.StoreService || entry?.Service || entry?.service || entry?.StoreCollectionService || entry;

const buildProductDisplayItem = (product, index) => ({
  id: product?.id || `product-${index}`,
  title: product?.name || product?.product_name || product?.title || "Product",
  description: product?.category || product?.description || "New arrival",
  price: formatNaira(product?.price) || "Contact for price",
  sku: product?.sku || "",
  category: product?.category || "",
  image:
    product?.image_url ||
    product?.image ||
    fallbackProductImages[index % fallbackProductImages.length],
  raw: product,
});

const buildCollectionCard = (title, items, type) => {
  const normalizedItems = Array.isArray(items) ? items : EMPTY_ARRAY;
  return {
    id: `${type}-${title}`.toLowerCase().replace(/\s+/g, "-"),
    title,
    previewItems: normalizedItems.slice(0, 4),
    previewImages: normalizedItems
      .map((item) => item?.image)
      .filter(Boolean)
      .slice(0, 4),
    count: `${normalizedItems.length} ${normalizedItems.length === 1 ? type : `${type}s`}`,
    countValue: normalizedItems.length,
    [type === "Service" ? "services" : "products"]: normalizedItems,
  };
};

const getProductDisplayKey = (product, index) =>
  product?.id ??
  product?.product_id ??
  product?.sku ??
  `${product?.title || product?.name || "product"}-${index}`;

const buildAllProductsCollection = (collections) => {
  const seenProducts = new Set();
  const mergedProducts = [];

  (Array.isArray(collections) ? collections : EMPTY_ARRAY).forEach((collection, collectionIndex) => {
    (Array.isArray(collection?.products) ? collection.products : EMPTY_ARRAY).forEach(
      (product, productIndex) => {
        const productKey = getProductDisplayKey(
          product,
          `${collectionIndex}-${productIndex}`
        );
        if (seenProducts.has(productKey)) return;
        seenProducts.add(productKey);
        mergedProducts.push(product);
      }
    );
  });

  return mergedProducts.length
    ? buildCollectionCard("All Products", mergedProducts, "Product")
    : null;
};

const parseAmount = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const numeric = Number(value.toString().replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
};

const getVariationName = (variation) =>
  (
    variation?.variation_name ||
    variation?.variation_type ||
    "Variation"
  )
    .toString()
    .trim();

const getVariationType = (variation) =>
  (
    variation?.variation_type ||
    variation?.type ||
    variation?.variation_name ||
    ""
  )
    .toString()
    .trim()
    .toLowerCase();

const getVariationOptionLabel = (option) =>
  (
    option?.option_display_name ||
    option?.option_value ||
    option?.value ||
    ""
  )
    .toString()
    .trim();

const getOptionStock = (option) => {
  const stock = Number(option?.stock ?? option?.quantity ?? option?.available_stock);
  return Number.isFinite(stock) ? stock : null;
};

const getOptionPriceAdjustment = (option) =>
  parseAmount(option?.price_adjustment ?? option?.price ?? option?.price_delta ?? 0) || 0;

const getOptionSwatchColor = (optionLabel) => {
  const label = optionLabel.toString().trim().toLowerCase();
  const namedColors = {
    black: "#1a1a1a",
    white: "#f4f1eb",
    cream: "#e8dcc8",
    brown: "#8b5e3c",
    tan: "#b6865b",
    navy: "#1e3a5f",
    blue: "#2563eb",
    red: "#dc2626",
    green: "#16a34a",
    yellow: "#f59e0b",
    pink: "#ec4899",
    purple: "#7c3aed",
    grey: "#71717a",
    gray: "#71717a",
  };

  return optionLabel?.startsWith?.("#") ? optionLabel : namedColors[label] || "#d9d6cf";
};

const getPriceRangeLabel = (prices, fallbackLabel) => {
  const validPrices = prices.filter((price) => Number.isFinite(price));
  if (!validPrices.length) return fallbackLabel || "Contact for price";

  const minPrice = Math.min(...validPrices);
  const maxPrice = Math.max(...validPrices);
  return minPrice === maxPrice
    ? formatNaira(minPrice)
    : `${formatNaira(minPrice)} - ${formatNaira(maxPrice)}`;
};

const getSelectedVariationEntries = (variationGroups, selectedVariationOptions = {}) =>
  (Array.isArray(variationGroups) ? variationGroups : [])
    .map((variation) => {
      const selectedOption =
        variation?.options?.find(
          (option) => option?.id === selectedVariationOptions?.[variation?.id]
        ) ||
        variation?.options?.find((option) => option?.is_default) ||
        variation?.options?.[0] ||
        null;
      const optionLabel = getVariationOptionLabel(selectedOption);
      if (!selectedOption || !optionLabel) return null;
      return {
        variationId: variation?.id ?? null,
        variationName: getVariationName(variation),
        optionId: selectedOption?.id ?? null,
        optionLabel,
      };
    })
    .filter(Boolean);

const findVariationValue = (entries, keywords) => {
  const normalizedKeywords = (Array.isArray(keywords) ? keywords : [keywords])
    .map((keyword) => keyword?.toString().trim().toLowerCase())
    .filter(Boolean);
  if (!normalizedKeywords.length) return "";
  const match = (Array.isArray(entries) ? entries : []).find((entry) => {
    const name = entry?.variationName?.toString().trim().toLowerCase() || "";
    return normalizedKeywords.some((keyword) => name.includes(keyword));
  });
  return match?.optionLabel || "";
};

const getCartItemVariantSignature = (item) => {
  const selectedOptions = Array.isArray(item?.selectedOptions) ? item.selectedOptions : [];
  if (selectedOptions.length) {
    return selectedOptions
      .map((entry) => {
        const variationKey = entry?.variationId ?? entry?.variationName ?? "variation";
        const optionKey = entry?.optionId ?? entry?.optionLabel ?? "";
        return `${variationKey}:${optionKey}`;
      })
      .sort()
      .join("|");
  }
  return [item?.size || "", item?.color || ""].join("|");
};

const resolveVariationSelection = (product, sizeValue) => {
  if (!product?.variations?.length || !sizeValue) {
    return { variationId: null, variationOptionId: null };
  }
  const normalizedSize = sizeValue.toString().trim().toLowerCase();
  if (!normalizedSize) return { variationId: null, variationOptionId: null };
  for (const variation of product.variations) {
    const options = Array.isArray(variation?.options) ? variation.options : [];
    for (const option of options) {
      const optionLabel = (
        option?.option_display_name ||
        option?.option_value ||
        option?.value ||
        ""
      )
        .toString()
        .trim()
        .toLowerCase();
      if (optionLabel && optionLabel === normalizedSize) {
        return {
          variationId: variation?.id ?? null,
          variationOptionId: option?.id ?? null,
        };
      }
    }
  }
  return { variationId: null, variationOptionId: null };
};

const readCartItems = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCartItems = (items) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
};

const getScheduleLabels = (scheduledAt) => {
  if (!scheduledAt) {
    return { dateLabel: "To be scheduled", timeLabel: "To be scheduled" };
  }
  const parts = parseIsoDateTimeParts(scheduledAt);
  if (!parts) {
    return { dateLabel: scheduledAt, timeLabel: "" };
  }
  const [year, month, day] = parts.datePart.split("-").map(Number);
  const [hour, minute] = parts.timePart.split(":").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  if (Number.isNaN(parsed.getTime())) {
    return { dateLabel: scheduledAt, timeLabel: "" };
  }
  const dateOptions = {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  };
  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
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

const normalizeCustomerSocialLinks = (links) => {
  const entries = Array.isArray(links) ? links : links ? [links] : [];

  return entries.flatMap((entry, index) => {
    if (!entry || typeof entry !== "object") return [];

    if ("url" in entry || "platform" in entry) {
      if (!entry.url) return [];
      return [
        {
          id: `${entry.platform || "social"}-${index}`,
          platform: entry.platform || "social",
          label: formatPlatformLabel(entry.platform),
          url: entry.url,
        },
      ];
    }

    return Object.entries(entry)
      .filter(([, value]) => typeof value === "string" && value.trim())
      .map(([platform, url]) => ({
        id: `${platform}-${index}`,
        platform,
        label: formatPlatformLabel(platform),
        url,
      }));
  });
};

const resolveStoreFooterAddresses = (storeData) => {
  const rawLocations = [
    storeData?.locations,
    storeData?.store_locations,
    storeData?.addresses,
    storeData?.store_addresses,
  ].find((value) => Array.isArray(value) && value.length);

  if (rawLocations) {
    return rawLocations
      .map((location) => {
        if (typeof location === "string") return location;
        if (!location || typeof location !== "object") return "";
        return [
          location.address,
          location.address1,
          location.street,
          location.city,
          location.state,
          location.country,
        ]
          .filter(Boolean)
          .join(", ");
      })
      .filter(Boolean)
      .slice(0, 2);
  }

  const primaryAddress = [
    storeData?.address,
    storeData?.store_address,
    storeData?.street_address,
    storeData?.city,
    storeData?.state,
    storeData?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return primaryAddress ? [primaryAddress] : [];
};

const resolveStoreFooterHours = (storeData) => {
  const rawHours =
    storeData?.store_hours ||
    storeData?.business_hours ||
    storeData?.opening_hours ||
    storeData?.hours;

  if (typeof rawHours === "string" && rawHours.trim()) {
    return rawHours
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 3);
  }

  if (Array.isArray(rawHours)) {
    return rawHours
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return "";
        const day = item.day || item.days || item.label;
        const time = item.time || item.hours || item.value;
        return [day, time].filter(Boolean).join(": ");
      })
      .filter(Boolean)
      .slice(0, 3);
  }

  if (rawHours && typeof rawHours === "object") {
    return Object.entries(rawHours)
      .map(([day, value]) => {
        if (typeof value === "string") return `${formatPlatformLabel(day)}: ${value}`;
        if (!value || typeof value !== "object") return "";
        const from = value.open || value.from || value.start;
        const to = value.close || value.to || value.end;
        return [formatPlatformLabel(day), [from, to].filter(Boolean).join(" - ")]
          .filter(Boolean)
          .join(": ");
      })
      .filter(Boolean)
      .slice(0, 3);
  }

  return ["Mon - Sat: 9am - 8pm", "Sunday: 12pm - 6pm"];
};

const truncateWords = (value, maxWords) => {
  if (typeof value !== "string") return "";

  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");

  return `${words.slice(0, maxWords).join(" ")}...`;
};

const CustomerStoreFooter = ({
  storeName,
  storeDescription,
  socialLinks,
  addresses,
  hours,
  showProducts,
  showServices,
  onShopAll,
  onServices,
  onViewCart,
}) => {
  const rawFooterDescription =
    (typeof storeDescription === "string" && storeDescription.trim()) ||
    "Premium products and services, delivered with care.";
  const footerDescription = truncateWords(rawFooterDescription, FOOTER_DESCRIPTION_WORD_LIMIT);
  const primaryAddress = addresses[0] || "Available online";
  const quickLinks = [
    showProducts ? { label: "Shop All", onClick: onShopAll } : null,
    showProducts ? { label: "New Arrivals", onClick: onShopAll } : null,
    showProducts ? { label: "Sale", onClick: onShopAll } : null,
    { label: "Collections", onClick: showProducts ? onShopAll : onServices },
    showServices ? { label: "Book Services", onClick: onServices } : null,
    { label: "Cart", onClick: onViewCart },
  ].filter(Boolean);

  return (
    <footer className={styles.customerHomeFooter}>
      <div className={styles.customerHomeFooterMain}>
        <section className={styles.customerHomeFooterBrand}>
          <h2 className={styles.customerHomeFooterLogo}>{storeName}</h2>
          <p className={styles.customerHomeFooterText}>{footerDescription}</p>

          <div className={styles.customerHomeFooterMobileAddress}>
            <span className={styles.customerHomeFooterPin} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="9" r="2.5" strokeWidth="2" />
              </svg>
            </span>
            <span>{primaryAddress}</span>
          </div>

          {socialLinks.length ? (
            <div className={styles.customerHomeFooterSocialBlock}>
              <span className={styles.customerHomeFooterMobileLabel}>Follow Us</span>
              <div className={styles.customerHomeFooterSocials}>
                {socialLinks.map((link) => (
                  <a
                    className={styles.customerHomeFooterSocial}
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.label}
                  >
                    {getSocialIcon(link.platform)}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {quickLinks.length ? (
          <section className={styles.customerHomeFooterLinks}>
            <h3 className={styles.customerHomeFooterHeading}>Quick Links</h3>
            <div className={styles.customerHomeFooterLinkList}>
              {quickLinks.map((link) => (
                <Button
                  className={styles.customerHomeFooterLink}
                  key={link.label}
                  type="button"
                  onClick={link.onClick}
                  unstyled
                >
                  {link.label}
                </Button>
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.customerHomeFooterContact}>
          <h3 className={styles.customerHomeFooterHeading}>Find Us</h3>
          <div className={styles.customerHomeFooterAddressList}>
            {addresses.length ? (
              addresses.map((address) => (
                <div className={styles.customerHomeFooterAddress} key={address}>
                  <span className={styles.customerHomeFooterPin} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12z"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="9" r="2.5" strokeWidth="2" />
                    </svg>
                  </span>
                  <span>{address}</span>
                </div>
              ))
            ) : (
              <p className={styles.customerHomeFooterText}>Available online</p>
            )}
          </div>

          {hours.length ? (
            <div className={styles.customerHomeFooterHours}>
              <h3 className={styles.customerHomeFooterHeading}>Store Hours</h3>
              {hours.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <div className={styles.customerHomeFooterBottom}>
        <span>
          &copy; {new Date().getFullYear()} {storeName} · Powered by MycroShop
        </span>
        <div className={styles.customerHomeFooterLegal}>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Returns</span>
        </div>
      </div>
    </footer>
  );
};

const ProductDetailLoader = ({ storeLogo, storeName }) => (
  <div className={styles.customerHomeDetailLoader} role="status" aria-live="polite">
    <img
      className={styles.customerHomeDetailLoaderLogo}
      src={storeLogo || storeAvatar}
      alt=""
      aria-hidden="true"
    />
    <div className={styles.customerHomeLoaderText}>
      <span>Preparing product details</span>
      <small>{storeName || "Store"} is getting this product ready</small>
    </div>
  </div>
);

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

const StorefrontShell = ({
  storeLogo,
  storeBannerImage,
  storeName,
  heroDescription,
  searchTerm,
  onSearchTermChange,
  searchPlaceholder,
  cartCount,
  onViewCart,
  heroActionLabel,
  onHeroAction,
  categoryItems,
  activeCategoryId,
  onSelectCategory,
  footer,
  children,
}) => {
  const hasBannerImage = Boolean(storeBannerImage);
  const heroStyle = hasBannerImage
    ? { "--customer-home-banner-image": `url(${JSON.stringify(storeBannerImage)})` }
    : undefined;
  const [isCategorySidebarOpen, setIsCategorySidebarOpen] = useState(false);
  const activeCategoryLabel =
    categoryItems.find((item) => item.id === activeCategoryId)?.label || "All";

  useEffect(() => {
    if (!isCategorySidebarOpen || typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsCategorySidebarOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCategorySidebarOpen]);

  const handleCategorySelect = (categoryId) => {
    onSelectCategory(categoryId);
    setIsCategorySidebarOpen(false);
  };

  return (
  <section className={styles.customerHomeShopShell}>
    <header className={styles.customerHomeShopHeader}>
      <div className={styles.customerHomeShopHeaderActions}>
        <div className={styles.customerHomeShopSearch}>
          <span className={styles.customerHomeShopSearchIcon} aria-hidden="true">
            🔍
          </span>
          <input
            className={styles.customerHomeShopSearchInput}
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
          />
        </div>

        <Button
          className={styles.customerHomeShopCartButton}
          type="button"
          onClick={onViewCart}
          unstyled
        >
          <span aria-hidden="true">🛒</span>
          <span>Cart</span>
          {cartCount ? (
            <span className={styles.customerHomeShopCartCount}>{cartCount}</span>
          ) : null}
        </Button>
      </div>
    </header>

    <section
      className={`${styles.customerHomeShopHero} ${
        hasBannerImage ? styles.customerHomeShopHeroWithBanner : ""
      }`}
      style={heroStyle}
    >
      <div className={styles.customerHomeShopHeroCopy}>
        <span className={styles.customerHomeShopHeroEyebrow}>Store banner</span>
        <h2 className={styles.customerHomeShopHeroTitle}>{storeName}</h2>
        <p className={styles.customerHomeShopHeroText}>{heroDescription}</p>
        {onHeroAction ? (
          <Button
            className={styles.customerHomeShopHeroButton}
            type="button"
            onClick={onHeroAction}
            unstyled
          >
            {heroActionLabel}
          </Button>
        ) : null}
      </div>

      {!hasBannerImage ? (
        <div className={styles.customerHomeShopHeroMedia}>
          <img src={storeLogo} alt={storeName} />
        </div>
      ) : null}
    </section>

    <div className={styles.customerHomeMobileCategoryBar}>
      <Button
        className={styles.customerHomeMobileCategoryButton}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isCategorySidebarOpen}
        onClick={() => setIsCategorySidebarOpen(true)}
        unstyled
      >
        <span className={styles.customerHomeMobileCategoryText}>
          <span>Categories</span>
          <strong>{activeCategoryLabel}</strong>
        </span>
        <span className={styles.customerHomeMobileCategoryIcon} aria-hidden="true">
          ☰
        </span>
      </Button>
    </div>

    <div className={styles.customerHomeShopLayout}>
      <Button
        className={`${styles.customerHomeShopSidebarBackdrop} ${
          isCategorySidebarOpen ? styles.customerHomeShopSidebarBackdropOpen : ""
        }`}
        type="button"
        aria-label="Close categories"
        onClick={() => setIsCategorySidebarOpen(false)}
        unstyled
      />
      <aside
        className={`${styles.customerHomeShopSidebar} ${
          isCategorySidebarOpen ? styles.customerHomeShopSidebarOpen : ""
        }`}
        aria-label="Categories"
      >
        <div className={styles.customerHomeShopSidebarCard}>
          <div className={styles.customerHomeShopSidebarHeader}>
            <p className={styles.customerHomeShopSidebarTitle}>Categories</p>
            <Button
              className={styles.customerHomeShopSidebarClose}
              type="button"
              aria-label="Close categories"
              onClick={() => setIsCategorySidebarOpen(false)}
              unstyled
            >
              ×
            </Button>
          </div>
          <div className={styles.customerHomeShopCategoryList}>
            {categoryItems.map((item) => (
              <Button
                className={`${styles.customerHomeShopCategoryButton} ${
                  activeCategoryId === item.id ? styles.customerHomeShopCategoryButtonActive : ""
                }`}
                key={item.id}
                type="button"
                onClick={() => handleCategorySelect(item.id)}
                unstyled
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </aside>

      {children}
    </div>

    {footer ? (
      <div className={styles.customerHomeShopFooter}>
        {footer}
      </div>
    ) : null}
  </section>
  );
};

const ProductCollectionsLanding = ({
  collections,
  onSelectCollection,
  onSelectProduct,
  onViewAllProducts,
  onViewCart,
  sectionTitle,
  storeLogo,
  storeBannerImage,
  storeName,
  storeDescription,
  cartCount,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCollectionId, setActiveCollectionId] = useState("all");

  const collectionFilters = useMemo(
    () => [
      { id: "all", label: "All" },
      ...collections.map((collection) => ({
        id: collection.id || collection.title,
        label: collection.title,
      })),
    ],
    [collections]
  );

  const visibleCollections = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return collections
      .filter((collection) =>
        activeCollectionId === "all"
          ? true
          : (collection.id || collection.title) === activeCollectionId
      )
      .map((collection) => {
        const matchingProducts = normalizedQuery
          ? collection.products.filter((product) =>
              [
                product?.title,
                product?.description,
                product?.price,
                product?.category,
                product?.sku,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(normalizedQuery)
            )
          : collection.products;

        return {
          ...collection,
          visibleProducts: matchingProducts,
          previewItems: matchingProducts.slice(0, 4),
        };
      })
      .filter((collection) => collection.visibleProducts.length);
  }, [activeCollectionId, collections, searchTerm]);

  const heroDescription = storeDescription?.trim() || "Discover curated products from this store.";
  const featuredCollection = collections[0] || null;

  return (
    <StorefrontShell
      sectionTitle={sectionTitle}
      storeLogo={storeLogo}
      storeBannerImage={storeBannerImage}
      storeName={storeName}
      heroDescription={heroDescription}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      searchPlaceholder="Search products"
      cartCount={cartCount}
      onViewCart={onViewCart}
      heroActionLabel="Shop collection"
      onHeroAction={featuredCollection ? () => onSelectCollection(featuredCollection) : null}
      categoryItems={collectionFilters}
      activeCategoryId={activeCollectionId}
      onSelectCategory={setActiveCollectionId}
      footer={
        onViewAllProducts ? (
          <Button
            className={styles.customerHomeViewAllButton}
            type="button"
            onClick={onViewAllProducts}
            unstyled
          >
            View all products
          </Button>
        ) : null
      }
    >
      <div className={styles.customerHomeCollectionLanding}>
        <div className={styles.customerHomeCollectionLandingHeader}>
          <h2 className={styles.customerHomeSectionTitle}>{sectionTitle}</h2>
          {searchTerm ? (
            <span className={styles.customerHomeCollectionLandingMeta}>
              Search results for "{searchTerm}"
            </span>
          ) : null}
        </div>

        <div className={styles.customerHomeCollectionList}>
          {visibleCollections.length ? visibleCollections.map((collection) => {
            const previewItems = Array.isArray(collection?.previewItems)
              ? collection.previewItems
              : collection?.products?.slice(0, 4) || EMPTY_ARRAY;

            return (
              <section
                className={styles.customerHomeCollectionPreviewSection}
                key={collection.id || collection.title}
              >
                <div className={styles.customerHomeCollectionPreviewHeader}>
                  <div className={styles.customerHomeCollectionPreviewHeading}>
                    <h3 className={styles.customerHomeCollectionPreviewTitle}>{collection.title}</h3>
                    <span className={styles.customerHomeCollectionPreviewCount}>
                      {collection.count}
                    </span>
                  </div>

                  <Button
                    className={styles.customerHomeCollectionPreviewAction}
                    type="button"
                    onClick={() => onSelectCollection(collection)}
                    unstyled
                  >
                    See all
                  </Button>
                </div>

                <div className={styles.customerHomeCollectionPreviewGrid}>
                  {previewItems.map((product, index) => (
                    <Button
                      className={styles.customerHomeCollectionPreviewCard}
                      key={getProductDisplayKey(product, index)}
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      unstyled
                    >
                      <div className={styles.customerHomeCollectionPreviewImageWrap}>
                        <img
                          className={styles.customerHomeCollectionPreviewImage}
                          src={product.image}
                          alt={product.title}
                        />
                      </div>

                      <div className={styles.customerHomeCollectionPreviewBody}>
                        <h4 className={styles.customerHomeCollectionPreviewProductTitle}>
                          {product.title}
                        </h4>
                        <p className={styles.customerHomeCollectionPreviewProductDesc}>
                          {product.description}
                        </p>
                        <span className={styles.customerHomeCollectionPreviewPrice}>
                          {product.price}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </section>
            );
          }) : (
            <div className={styles.customerHomeEmptyState}>
              <p className={styles.customerHomeEmptyTitle}>No matching products</p>
              <p className={styles.customerHomeEmptyText}>
                Try another collection or search term.
              </p>
            </div>
          )}
        </div>

      </div>
    </StorefrontShell>
  );
};

const ServiceCollectionsLanding = ({
  collections,
  onSelectCollection,
  onSelectService,
  onViewCart,
  sectionTitle,
  storeLogo,
  storeBannerImage,
  storeName,
  storeDescription,
  cartCount,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCollectionId, setActiveCollectionId] = useState("all");

  const collectionFilters = useMemo(
    () => [
      { id: "all", label: "All" },
      ...collections.map((collection) => ({
        id: collection.id || collection.title,
        label: collection.title,
      })),
    ],
    [collections]
  );

  const visibleCollections = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return collections
      .filter((collection) =>
        activeCollectionId === "all"
          ? true
          : (collection.id || collection.title) === activeCollectionId
      )
      .map((collection) => {
        const matchingServices = normalizedQuery
          ? collection.services.filter((service) =>
              [
                service?.name,
                service?.title,
                service?.description,
                service?.category,
                service?.priceLabel,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(normalizedQuery)
            )
          : collection.services;

        return {
          ...collection,
          visibleServices: matchingServices,
          previewItems: matchingServices.slice(0, 4),
        };
      })
      .filter((collection) => collection.visibleServices.length);
  }, [activeCollectionId, collections, searchTerm]);

  const heroDescription =
    storeDescription?.trim() || "Book popular services and explore every collection from one place.";
  const featuredCollection = collections[0] || null;

  return (
    <StorefrontShell
      sectionTitle={sectionTitle}
      storeLogo={storeLogo}
      storeBannerImage={storeBannerImage}
      storeName={storeName}
      heroDescription={heroDescription}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      searchPlaceholder="Search services"
      cartCount={cartCount}
      onViewCart={onViewCart}
      heroActionLabel="View services"
      onHeroAction={featuredCollection ? () => onSelectCollection(featuredCollection) : null}
      categoryItems={collectionFilters}
      activeCategoryId={activeCollectionId}
      onSelectCategory={setActiveCollectionId}
    >
      <div className={styles.customerHomeCollectionLanding}>
        <div className={styles.customerHomeCollectionLandingHeader}>
          <h2 className={styles.customerHomeSectionTitle}>{sectionTitle}</h2>
          {searchTerm ? (
            <span className={styles.customerHomeCollectionLandingMeta}>
              Search results for "{searchTerm}"
            </span>
          ) : null}
        </div>

        <div className={styles.customerHomeCollectionList}>
          {visibleCollections.length ? visibleCollections.map((collection) => (
            <section
              className={styles.customerHomeCollectionPreviewSection}
              key={collection.id || collection.title}
            >
              <div className={styles.customerHomeCollectionPreviewHeader}>
                <div className={styles.customerHomeCollectionPreviewHeading}>
                  <h3 className={styles.customerHomeCollectionPreviewTitle}>{collection.title}</h3>
                  <span className={styles.customerHomeCollectionPreviewCount}>
                    {collection.count}
                  </span>
                </div>

                <Button
                  className={styles.customerHomeCollectionPreviewAction}
                  type="button"
                  onClick={() => onSelectCollection(collection)}
                  unstyled
                >
                  See all
                </Button>
              </div>

              <div className={styles.customerHomeCollectionPreviewGrid}>
                {collection.previewItems.map((service, index) => (
                  <Button
                    className={`${styles.customerHomeCollectionPreviewCard} ${styles.customerHomeCollectionPreviewCardService}`}
                    key={`${service.id || service.title}-${index}`}
                    type="button"
                    onClick={() => onSelectService(service)}
                    unstyled
                  >
                    <div className={styles.customerHomeCollectionPreviewImageWrap}>
                      <img
                        className={styles.customerHomeCollectionPreviewImage}
                        src={service.image}
                        alt={service.name || service.title}
                      />
                    </div>

                    <div className={styles.customerHomeCollectionPreviewBody}>
                      <h4 className={styles.customerHomeCollectionPreviewProductTitle}>
                        {service.name || service.title}
                      </h4>
                      <p className={styles.customerHomeCollectionPreviewProductDesc}>
                        {service.description}
                      </p>
                      <span className={styles.customerHomeCollectionPreviewServiceCta}>
                        {service.cta}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </section>
          )) : (
            <div className={styles.customerHomeEmptyState}>
              <p className={styles.customerHomeEmptyTitle}>No matching services</p>
              <p className={styles.customerHomeEmptyText}>
                Try another collection or search term.
              </p>
            </div>
          )}
        </div>
      </div>
    </StorefrontShell>
  );
};

const CollectionDetailView = ({ collection, onBack, onSelectProduct, storeLogo, storeName }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    if (!normalizedQuery) return collection.products;

    return collection.products.filter((product) => {
      const searchableText = [
        product?.title,
        product?.description,
        product?.price,
        product?.sku,
        product?.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [collection.products, searchTerm]);

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
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
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
        {filteredProducts.map((product) => (
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
              <div className={styles.customerHomeProductBodyTop}>
                <div>
                  <h3 className={styles.customerHomeProductTitle}>{product.title}</h3>
                  <p className={styles.customerHomeProductDesc}>{product.description}</p>
                </div>
                <span className={styles.customerHomeProductAddIcon} aria-hidden="true">
                  +
                </span>
              </div>
              <span className={styles.customerHomeProductPrice}>{product.price}</span>
            </div>
          </Button>
        ))}
      </div>
      {!filteredProducts.length && (
        <div className={styles.customerHomeEmptyState}>
          <p className={styles.customerHomeEmptyTitle}>No matching products</p>
          <p className={styles.customerHomeEmptyText}>
            Try a different product name or keyword.
          </p>
        </div>
      )}

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

const ServiceCollectionDetailView = ({ collection, onBack, onSelectService }) => {
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

      <div className={styles.customerHomeCollectionMeta}>
        <h2 className={styles.customerHomeSectionTitle}>{collection.title}</h2>
        <span className={styles.customerHomeCollectionCountMeta}>
          {collection.services.length} Service{collection.services.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className={styles.customerHomeServiceList}>
        {collection.services.map((item, index) => (
          <Button
            className={styles.customerHomeServiceCard}
            key={`${item.id ?? item.title ?? "service"}-${index}`}
            type="button"
            onClick={() => onSelectService(item)}
            unstyled
          >
            <img
              className={styles.customerHomeServiceImage}
              src={item.image}
              alt={item.title}
            />
            <div className={styles.customerHomeServiceText}>
              <span className={styles.customerHomeServiceTitle}>{item.title}</span>
              <span className={styles.customerHomeServiceCta}>{item.cta}</span>
            </div>
            <span className={styles.customerHomeServiceMenu} aria-hidden="true">
              ...
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
};

const ServiceDetailView = ({ service, onBack, onBook, storeName, shareOptions = [] }) => {
  const bookingMeta = getServiceBookingMeta(service);
  const serviceAvailability = normalizeAvailability(service?.availability);
  const availableDayLabels = Object.entries(serviceAvailability)
    .filter(([, details]) => details?.available)
    .map(([day, details]) => {
      const slots = Array.isArray(details?.time_slots) ? details.time_slots : [];
      return {
        day,
        slots,
      };
    });
  const serviceName = bookingMeta.name || service?.name || service?.title || "Service";
  const servicePrice = bookingMeta.price || service?.priceLabel || formatNaira(service?.price);
  const serviceDuration = bookingMeta.duration || service?.duration || "";
  const locationLabel = formatLocationType(service?.locationType);
  const description =
    [service?.description, service?.raw?.description, service?.category]
      .find((value) => typeof value === "string" && value.trim()) ||
    "Service details available on request.";
  const metaRows = [
    { label: "Duration", value: serviceDuration || "Schedule on request" },
    { label: "Category", value: service?.category },
  ].filter((row) => row.value !== null && row.value !== undefined && row.value !== "");

  return (
    <section className={styles.customerHomeProductDetail}>
      <header className={styles.customerHomeProductHeader}>
        <Button
          className={styles.customerHomeBackButton}
          type="button"
          onClick={onBack}
          aria-label="Back to services"
          unstyled
        >
          ←
        </Button>
        <span className={styles.customerHomeProductHeaderTitle}>
          {storeName || "Service Details"}
        </span>
        <span className={styles.customerHomeHeaderSpacer} aria-hidden="true" />
      </header>

      <div className={styles.customerHomeProductMain}>
        <div className={styles.customerHomeProductMedia}>
          <div className={styles.customerHomeProductHero}>
            <img src={service?.image} alt={serviceName} />
          </div>
        </div>

        <div className={styles.customerHomeProductInfo}>
          <div>
            <h2 className={styles.customerHomeProductTitleLarge}>{serviceName}</h2>
          </div>
          <div className={styles.customerHomeProductPriceLarge}>
            {servicePrice || "Contact for price"}
          </div>
          <div className={styles.customerHomeDetailDivider} />

          <div className={styles.customerHomeProductMeta}>
            {metaRows.map((row) => (
              <div key={row.label} className={styles.customerHomeProductMetaRow}>
                <span className={styles.customerHomeProductMetaLabel}>{row.label}</span>
                <span className={styles.customerHomeProductMetaValue}>{row.value}</span>
              </div>
            ))}
          </div>

          <div className={`${styles.customerHomeDetailGroup} ${styles.customerHomeServiceDetailSection}`}>
            <span className={styles.customerHomeDetailLabel}>About this service</span>
            <p className={styles.customerHomeProductDescLarge}>{description}</p>
          </div>

          <div className={`${styles.customerHomeDetailGroup} ${styles.customerHomeServiceDetailSection}`}>
            <span className={styles.customerHomeDetailLabel}>Availability</span>
            {availableDayLabels.length ? (
              <div className={styles.customerHomeAvailability}>
                {availableDayLabels.map(({ day, slots }) => (
                  <div key={day} className={styles.customerHomeAvailabilityRow}>
                    <span className={styles.customerHomeAvailabilityDay}>{day}</span>
                    <div className={styles.customerHomeAvailabilitySlots}>
                      {slots.length ? (
                        slots.map((slot) => (
                          <span
                            key={`${service?.id || serviceName}-${day}-${slot}`}
                            className={styles.customerHomeAvailabilitySlot}
                          >
                            {slot}
                          </span>
                        ))
                      ) : (
                        <span className={styles.customerHomeAvailabilityStatus}>
                          Available
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.customerHomeProductDescLarge}>
                Availability will be confirmed when you book.
              </p>
            )}
          </div>

          <div className={`${styles.customerHomeDetailGroup} ${styles.customerHomeServiceDetailSection}`}>
            <span className={styles.customerHomeDetailLabel}>Location</span>
            <p className={styles.customerHomeProductDescLarge}>{locationLabel}</p>
          </div>

          <Button
            className={styles.customerHomeAddToCartButton}
            type="button"
            onClick={onBook}
            unstyled
          >
            Book Now
          </Button>

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
    </section>
  );
};

const ProductDetailView = ({
  product,
  onBack,
  storeName,
  cartCount = 0,
  onAddToCart,
  onViewCart,
  isInCart = false,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [activeDescriptionTab, setActiveDescriptionTab] = useState("description");
  const variationGroups = useMemo(
    () =>
      sortByOrder(product?.variations).map((variation) => ({
        ...variation,
        options: sortByOrder(variation?.options).filter((option) => option?.is_available !== 0),
      })),
    [product?.variations]
  );
  const initialVariationSelections = useMemo(
    () =>
      variationGroups.reduce((acc, variation) => {
        const defaultOption =
          variation.options.find((option) => option?.is_default) || variation.options[0];
        if (defaultOption?.id !== undefined && defaultOption?.id !== null) {
          acc[variation.id] = defaultOption.id;
        }
        return acc;
      }, {}),
    [variationGroups]
  );
  const [selectedVariationOptions, setSelectedVariationOptions] = useState(
    () => initialVariationSelections
  );
  const primaryVariation = variationGroups[0] || null;
  const primarySelectedOption =
    primaryVariation?.options.find(
      (option) => option?.id === selectedVariationOptions?.[primaryVariation?.id]
    ) ||
    primaryVariation?.options[0] ||
    null;
  const [activeImage, setActiveImage] = useState(
    () => primarySelectedOption?.image_url || product?.image
  );
  const carouselRef = React.useRef(null);
  const thumbRefs = React.useRef({});
  const dragStateRef = React.useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  });
  const variationImages = useMemo(() => {
    const images = [];
    if (!variationGroups.length) return images;
    variationGroups.forEach((variation) => {
      variation.options.forEach((option) => {
        if (option?.image_url) {
          images.push({
            id: option.id || `${variation.id || variation.variation_name}-${option.option_value}`,
            src: option.image_url,
            alt: option.option_display_name || option.option_value || "Variation",
            variationId: variation.id,
            optionId: option.id,
          });
        }
      });
    });
    return images;
  }, [variationGroups]);
  useEffect(() => {
    setActiveImage(primarySelectedOption?.image_url || product?.image);
  }, [primarySelectedOption?.image_url, product?.image, product?.id]);
  const description =
    [
      product?.description,
      product?.product_description,
      product?.short_description,
      product?.category,
      product?.details,
    ].find((value) => typeof value === "string" && value.trim()) ||
    "Product details available.";
  const baseProductPrice = parseAmount(product?.price);
  const selectedVariationEntries = useMemo(
    () => getSelectedVariationEntries(variationGroups, selectedVariationOptions),
    [variationGroups, selectedVariationOptions]
  );
  const selectedOptions = selectedVariationEntries
    .map((entry) => {
      const variation = variationGroups.find((group) => group?.id === entry.variationId);
      const option = variation?.options?.find((item) => item?.id === entry.optionId);
      return option ? { ...entry, option, variation } : null;
    })
    .filter(Boolean);
  const selectedOptionsComplete =
    variationGroups.length === 0 ||
    variationGroups.every((variation) =>
      variation?.options?.some((option) => option?.id === selectedVariationOptions?.[variation?.id])
    );
  const selectedOptionPriceAdjustment = selectedOptions.reduce(
    (total, entry) => total + getOptionPriceAdjustment(entry.option),
    0
  );
  const selectedOptionStocks = selectedOptions
    .map((entry) => getOptionStock(entry.option))
    .filter((stock) => stock !== null);
  const selectedStock =
    selectedOptionStocks.length > 0
      ? Math.min(...selectedOptionStocks)
      : Number.isFinite(Number(product?.stock))
        ? Number(product.stock)
        : null;
  const allVariationPrices = variationGroups.flatMap((variation) =>
    variation.options.map((option) => {
      if (baseProductPrice === null && getOptionPriceAdjustment(option) === 0) return null;
      return (baseProductPrice || 0) + getOptionPriceAdjustment(option);
    })
  );
  const resolvedVariationPrice =
    baseProductPrice !== null || selectedOptionPriceAdjustment
      ? (baseProductPrice || 0) + selectedOptionPriceAdjustment
      : null;
  const resolvedVariationPriceLabel =
    selectedOptionsComplete && resolvedVariationPrice !== null
      ? formatNaira(resolvedVariationPrice)
      : getPriceRangeLabel(allVariationPrices, product?.price || "Contact for price");
  const priceNote = variationGroups.length
    ? selectedOptionsComplete
      ? selectedVariationEntries.map((entry) => entry.optionLabel).join(" · ")
      : "Price may vary by selected options"
    : "Ready to add to cart";
  const selectedSku =
    selectedOptions.map((entry) => entry.option?.sku).find(Boolean) || product?.sku || "";
  const selectedBarcode =
    selectedOptions.map((entry) => entry.option?.barcode).find(Boolean) || product?.barcode || "";
  const stockState =
    !selectedOptionsComplete
      ? "pending"
      : selectedStock === null
        ? "unknown"
        : selectedStock <= 0
          ? "out"
          : selectedStock < 5
            ? "low"
            : "in";

  const scrollThumbIntoView = (thumbId) => {
    const el = thumbRefs.current?.[thumbId];
    if (!el || !el.scrollIntoView) return;
    el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  const handleCarouselPointerDown = (event) => {
    if (!carouselRef.current) return;
    dragStateRef.current.isDragging = true;
    dragStateRef.current.startX = event.clientX;
    dragStateRef.current.scrollLeft = carouselRef.current.scrollLeft;
    carouselRef.current.setPointerCapture?.(event.pointerId);
  };

  const handleCarouselPointerMove = (event) => {
    if (!carouselRef.current || !dragStateRef.current.isDragging) return;
    const delta = event.clientX - dragStateRef.current.startX;
    carouselRef.current.scrollLeft = dragStateRef.current.scrollLeft - delta;
  };

  const handleCarouselPointerUp = (event) => {
    if (!dragStateRef.current.isDragging) return;
    dragStateRef.current.isDragging = false;
    carouselRef.current?.releasePointerCapture?.(event.pointerId);
  };
  const metaRows = [
    { label: "SKU", value: product?.sku },
    { label: "Category", value: product?.category },
    { label: "Barcode", value: product?.barcode },
  ].filter((row) => row.value !== null && row.value !== undefined && row.value !== "");
  const selectedVariationPayload = primaryVariation && primarySelectedOption
    ? {
        label:
          primarySelectedOption?.option_display_name ||
          primarySelectedOption?.option_value ||
          primaryVariation?.variation_name ||
          "",
        variationId: primaryVariation?.id ?? null,
        variationOptionId: primarySelectedOption?.id ?? null,
        priceValue: resolvedVariationPrice,
        priceLabel: resolvedVariationPriceLabel,
        selections: selectedVariationEntries,
        sizeLabel:
          findVariationValue(selectedVariationEntries, "size") ||
          (primaryVariation?.variation_name?.toString().trim().toLowerCase().includes("size")
            ? getVariationOptionLabel(primarySelectedOption)
            : ""),
        colorLabel: findVariationValue(selectedVariationEntries, ["color", "colour"]),
      }
    : null;
  const canAddSelectedProduct = stockState !== "out";

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
          onClick={onViewCart}
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
          <span className={styles.customerHomeCartBadge}>{cartCount}</span>
        </Button>
      </header>

      <div className={styles.customerHomeProductMain}>
        <div className={styles.customerHomeProductMedia}>
          <div className={styles.customerHomeProductHero}>
            <img src={activeImage || primarySelectedOption?.image_url || product.image} alt={product.title} />
          </div>
          {variationImages.length ? (
            <div className={styles.customerHomeVariationCarousel} aria-label="Product variations">
              <Button
                className={styles.customerHomeVariationArrow}
                type="button"
                aria-label="Scroll variations left"
                onClick={() => {
                  if (!carouselRef.current) return;
                  carouselRef.current.scrollBy({ left: -220, behavior: "smooth" });
                }}
                unstyled
              >
                ‹
              </Button>
              <div
                className={styles.customerHomeVariationTrack}
                ref={carouselRef}
                role="listbox"
                aria-label="Variation thumbnails"
              >
                {variationImages.map((image) => (
                  <Button
                    key={image.id}
                    className={`${styles.customerHomeVariationThumb} ${
                      activeImage === image.src ? styles.customerHomeVariationThumbActive : ""
                    }`}
                    type="button"
                    onClick={() => {
                      setActiveImage(image.src);
                      if (image.variationId && image.optionId) {
                        setSelectedVariationOptions((prev) => ({
                          ...prev,
                          [image.variationId]: image.optionId,
                        }));
                      }
                      scrollThumbIntoView(image.id);
                    }}
                    ref={(el) => {
                      if (el) {
                        thumbRefs.current[image.id] = el;
                      }
                    }}
                    unstyled
                    role="option"
                    aria-selected={activeImage === image.src}
                  >
                    <img src={image.src} alt={image.alt} loading="lazy" />
                  </Button>
                ))}
              </div>
              <Button
                className={styles.customerHomeVariationArrow}
                type="button"
                aria-label="Scroll variations right"
                onClick={() => {
                  if (!carouselRef.current) return;
                  carouselRef.current.scrollBy({ left: 220, behavior: "smooth" });
                }}
                unstyled
              >
                ›
              </Button>
            </div>
          ) : null}
        </div>

        <div className={styles.customerHomeProductInfo}>
          <div className={styles.customerHomeProductEyebrow}>
            {(product?.category || storeName || "Storefront").toString()}
          </div>
          <h2 className={styles.customerHomeProductTitleLarge}>{product.title}</h2>
          <div className={styles.customerHomeProductPriceLarge}>{resolvedVariationPriceLabel}</div>
          <p className={styles.customerHomeProductPriceNote}>{priceNote}</p>
          <div className={styles.customerHomeDetailDivider} />
          {metaRows.length ? (
            <div className={styles.customerHomeProductMeta}>
              {metaRows.map((row) => (
                <div key={row.label} className={styles.customerHomeProductMetaRow}>
                  <span className={styles.customerHomeProductMetaLabel}>{row.label}</span>
                  <span className={styles.customerHomeProductMetaValue}>{row.value}</span>
                </div>
              ))}
            </div>
          ) : null}

          {variationGroups.length ? (
            <div className={styles.customerHomeDetailGroup}>
              <div className={styles.customerHomeVariationList}>
                {variationGroups.map((variation) => (
                  <div
                    key={variation.id || variation.variation_name}
                    className={styles.customerHomeVariationGroup}
                  >
                    <span className={styles.customerHomeVariationName}>
                      {variation.variation_name || variation.variation_type || "Variation"}:
                      <strong>
                        {selectedVariationEntries.find(
                          (entry) => entry.variationId === variation.id
                        )?.optionLabel || " choose one"}
                      </strong>
                    </span>
                    <div className={styles.customerHomeVariationOptions}>
                      {variation.options.map((option) => {
                        const optionLabel =
                          option?.option_display_name || option?.option_value || "Option";
                        const isActive = selectedVariationOptions?.[variation.id] === option?.id;
                        const optionPrice = parseAmount(option?.price_adjustment);
                        const optionPriceLabel =
                          optionPrice !== null
                            ? formatNaira(
                                baseProductPrice !== null ? baseProductPrice + optionPrice : optionPrice
                              )
                            : "";
                        const isColorOption = getVariationType(variation).includes("color");
                        const optionStock = getOptionStock(option);
                        const isUnavailable = option?.is_available === 0 || optionStock === 0;

                        return (
                        <Button
                          key={option.id || option.option_value}
                          type="button"
                          aria-label={isColorOption ? `Select ${optionLabel}` : undefined}
                          title={isColorOption ? optionLabel : undefined}
                          className={`${isColorOption ? styles.customerHomeColorOption : styles.customerHomeSizeOption} ${
                            isActive ? styles.customerHomeSizeOptionActive : ""
                          } ${isUnavailable ? styles.customerHomeOptionUnavailable : ""
                          }`}
                          style={
                            isColorOption
                              ? { "--customer-option-color": getOptionSwatchColor(optionLabel) }
                              : undefined
                          }
                          onClick={() => {
                            if (isUnavailable) return;
                            setSelectedVariationOptions((prev) => ({
                              ...prev,
                              [variation.id]: option.id,
                            }));
                            if (option?.image_url) {
                              setActiveImage(option?.image_url || product?.image);
                            }
                          }}
                          unstyled
                          disabled={isUnavailable}
                        >
                          {isColorOption ? (
                            <span className={styles.customerHomeColorDot} aria-hidden="true" />
                          ) : (
                            <span>{optionPriceLabel ? `${optionLabel} · ${optionPriceLabel}` : optionLabel}</span>
                          )}
                        </Button>
                      )})}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {variationGroups.length && selectedOptionsComplete ? (
            <div className={styles.customerHomeVariantInfoCard}>
              <span className={styles.customerHomeVariantInfoTitle}>Selected variant details</span>
              <div className={styles.customerHomeVariantInfoRow}>
                <span>SKU</span>
                <strong>{selectedSku || "N/A"}</strong>
              </div>
              <div className={styles.customerHomeVariantInfoRow}>
                <span>Barcode</span>
                <strong>{selectedBarcode || "N/A"}</strong>
              </div>
            </div>
          ) : null}

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

          <div className={styles.customerHomeProductActionRow}>
            <Button
              className={styles.customerHomeAddToCartButton}
              type="button"
              onClick={() => {
                if (!canAddSelectedProduct) return;
                onAddToCart?.(product, quantity, selectedVariationPayload);
              }}
              unstyled
              disabled={!canAddSelectedProduct}
            >
              {isInCart ? "Added to Cart" : "Add to Cart"}
            </Button>

            <Button
              className={styles.customerHomeBuyNowButton}
              type="button"
              onClick={() => {
                if (!canAddSelectedProduct) return;
                onAddToCart?.(product, quantity, selectedVariationPayload);
                onViewCart?.();
              }}
              unstyled
              disabled={!canAddSelectedProduct}
            >
              Buy Now
            </Button>
          </div>

          <div className={styles.customerHomeCheckoutMetaRow}>
            <span>Secure checkout</span>
            <span>Fast delivery</span>
            <span>Easy returns</span>
          </div>
        </div>
        <div className={styles.customerHomeProductDescBelow}>
          <div className={styles.customerHomeDescTabs}>
            {[
              { id: "description", label: "Description" },
              { id: "details", label: "Details" },
              { id: "shipping", label: "Shipping" },
            ].map((tab) => (
              <Button
                key={tab.id}
                type="button"
                className={`${styles.customerHomeDescTab} ${
                  activeDescriptionTab === tab.id ? styles.customerHomeDescTabActive : ""
                }`}
                onClick={() => setActiveDescriptionTab(tab.id)}
                unstyled
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {activeDescriptionTab === "description" && (
            <p className={styles.customerHomeProductDescLarge}>{description}</p>
          )}
          {activeDescriptionTab === "details" && (
            <div className={styles.customerHomeProductMeta}>
              {[...metaRows, { label: "Options", value: selectedVariationEntries.map((entry) => entry.optionLabel).join(", ") }]
                .filter((row) => row.value)
                .map((row) => (
                  <div key={`detail-${row.label}`} className={styles.customerHomeProductMetaRow}>
                    <span className={styles.customerHomeProductMetaLabel}>{row.label}</span>
                    <span className={styles.customerHomeProductMetaValue}>{row.value}</span>
                  </div>
                ))}
            </div>
          )}
          {activeDescriptionTab === "shipping" && (
            <p className={styles.customerHomeProductDescLarge}>
              Delivery details and return options will be confirmed during checkout.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

const BookingConfirmation = ({ service, scheduledAt, locationType, onClose, onCancel }) => {
  const bookingMeta = getServiceBookingMeta(service);
  const { dateLabel, timeLabel } = getScheduleLabels(scheduledAt);
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
            <Button
              className={styles.customerHomeConfirmSecondary}
              type="button"
              onClick={onClose}
              unstyled
            >
              Continue to Home Store
            </Button>
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

const CancelAppointment = ({ service, scheduledAt, onClose, onConfirm }) => {
  const bookingMeta = getServiceBookingMeta(service);
  const { dateLabel } = getScheduleLabels(scheduledAt);
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

const CancelledSuccess = ({ service, scheduledAt, onClose, onReschedule }) => {
  const bookingMeta = getServiceBookingMeta(service);
  const { dateLabel, timeLabel } = getScheduleLabels(scheduledAt);
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
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { content, loading, error, bookingPayload, bookingLoading, bookingError, productDetails } = useSelector(
    (state) => state.customer
  );
  const getTenantId = JSON.parse(localStorage.getItem("user") || "null");
  let getStoreName = localStorage.getItem("storeView");
  console.log(getStoreName)

  // useEffect(() => {
  //   if (token && getTenantId?.tenantId) {
  //     dispatch(getOnlineEcommerceStore({ token, tenant_id: getTenantId.tenantId, store: getStoreName }));
  //   }
  // }, [dispatch, token, getTenantId?.tenantId, getStoreName]);

  useEffect(() => {
    if (token && '21') {
      dispatch(getOnlineEcommerceStore({ token, tenant_id: '21', store: 'stride' }));
    }
  }, [dispatch, token, '21', 'stride']);

  useEffect(() => {
    if (token) {
      dispatch(getStorePreview({ token }));
    }
  }, [token, dispatch])
  const storeData = content?.data?.store;
  const storeName = storeData?.store_name || "Awesome Store";
  const storedCustomerLogo = useMemo(() => readStoredCustomerLogo(), []);
  const storeLogo = storeData?.profile_logo_url || storedCustomerLogo || storeAvatar;
  const storeBannerImage = resolveStoreBannerImage(storeData);
  const storeDescription = storeData?.store_description;
  const customerThemeStyle = useMemo(
    () => buildCustomerThemeStyle(storeData?.selected_theme),
    [storeData?.selected_theme]
  );
  useEffect(() => {
    writeStoredCustomerTheme(storeData?.selected_theme);
  }, [storeData?.selected_theme]);
  useEffect(() => {
    if (!storeData?.profile_logo_url || typeof window === "undefined") return;
    try {
      localStorage.setItem(CUSTOMER_LOGO_STORAGE_KEY, storeData.profile_logo_url);
    } catch {
      // Ignore storage errors
    }
  }, [storeData?.profile_logo_url]);
  useEffect(() => {
    setVisibleDescriptionWords(DESCRIPTION_WORD_STEP);
  }, [storeDescription]);
  const showStoreLoader = !storeData && !error && (loading || (!content?.data && Boolean(token)));
  const resolvedTenantId = getTenantId?.tenantId ?? null;
  const socialLinks = storeData?.social_links ?? EMPTY_ARRAY;
  const normalizedSocialLinks = useMemo(
    () => normalizeCustomerSocialLinks(socialLinks),
    [socialLinks]
  );
  const footerAddresses = useMemo(
    () => resolveStoreFooterAddresses(storeData),
    [storeData]
  );
  const footerHours = useMemo(
    () => resolveStoreFooterHours(storeData),
    [storeData]
  );
  const toggles = content?.data?.toggles ?? {};
  const showProducts = toggles?.show_products !== false;
  const showServices = toggles?.show_services !== false;
  const productCollectionsPayload = content?.data?.product_collections?.items ?? EMPTY_ARRAY;
  const serviceCollectionsPayload = content?.data?.service_collections?.items ?? EMPTY_ARRAY;
  const productsNotInCollections = content?.data?.products_not_in_collections?.items ?? EMPTY_ARRAY;
  const servicesNotInCollections = content?.data?.services_not_in_collections?.items ?? EMPTY_ARRAY;

  const [activeTab, setActiveTab] = useState("shop");
  const [visibleDescriptionWords, setVisibleDescriptionWords] = useState(DESCRIPTION_WORD_STEP);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetailLoadingId, setProductDetailLoadingId] = useState(null);
  const [selectedProductCollection, setSelectedProductCollection] = useState(null);
  const [selectedServiceCollection, setSelectedServiceCollection] = useState(null);
  const [activeService, setActiveService] = useState(null);
  const [bookingService, setBookingService] = useState(null);
  const location = useLocation();
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTimeSlot, setBookingTimeSlot] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelledBooking, setCancelledBooking] = useState(null);
  const bookingMetadata = bookingPayload?.metadata || {};
  const [cartItems, setCartItems] = useState(() => readCartItems());
  const [showScrollHint, setShowScrollHint] = useState(false);
  const scrollRef = React.useRef(null);
  const cartCount = useMemo(() => cartItems.length, [cartItems]);
  const storeDescriptionWords = useMemo(
    () =>
      typeof storeDescription === "string"
        ? storeDescription.trim().split(/\s+/).filter(Boolean)
        : [],
    [storeDescription]
  );
  const visibleStoreDescription = useMemo(
    () => storeDescriptionWords.slice(0, visibleDescriptionWords).join(" "),
    [storeDescriptionWords, visibleDescriptionWords]
  );
  const hasMoreStoreDescription = storeDescriptionWords.length > visibleDescriptionWords;
  const sectionTitle = activeTab === "services" ? "Service Collections" : "Collections";
  const isCollectionDetailView = Boolean(
    (activeTab === "services" && selectedServiceCollection) ||
      (activeTab === "shop" && selectedProductCollection)
  );
  const isProductDetailView = activeTab === "shop" && selectedProduct;
  const isServiceDetailView = activeTab === "services" && activeService;
  const isDetailView = isProductDetailView || isServiceDetailView;
  const isNestedView = isCollectionDetailView || isDetailView;
  const bookingMeta = getServiceBookingMeta(bookingService);
  const selectedBookingAmount = parseAmount(bookingService?.price ?? bookingMeta.price);
  const bookingAmount = selectedBookingAmount ?? bookingPayload?.amount;
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
  const todayDate = useMemo(() => toDateOnly(new Date()), []);
  const minBookingMonth = useMemo(
    () => new Date(todayDate.getFullYear(), todayDate.getMonth(), 1),
    [todayDate]
  );
  const [visibleBookingMonth, setVisibleBookingMonth] = useState(() => minBookingMonth);
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
  const canGoToPreviousBookingMonth = visibleBookingMonth > minBookingMonth;
  const bookingMonthLabel = useMemo(
    () =>
      visibleBookingMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    [visibleBookingMonth]
  );
  const isBookingDateSelectable = React.useCallback(
    (date) => {
      const normalizedDate = toDateOnly(date);
      if (!normalizedDate || normalizedDate < todayDate) return false;
      if (!hasAvailability) return true;
      const dayKey = getWeekdayKeyFromDate(normalizedDate);
      return Boolean(serviceAvailability?.[dayKey]?.available);
    },
    [hasAvailability, serviceAvailability, todayDate]
  );
  const bookingCalendarDays = useMemo(
    () =>
      buildCalendarDays(visibleBookingMonth).map((day) => ({
        ...day,
        isSelectable: day.isCurrentMonth && isBookingDateSelectable(day.date),
      })),
    [isBookingDateSelectable, visibleBookingMonth]
  );

  const shareOptions = useMemo(
    () =>
      normalizedSocialLinks
        .filter((link) => link?.url)
        .map((link, index) => ({
          id: `${link.platform || "social"}-${index}`,
          label: formatPlatformLabel(link.platform),
          className: getSocialClassName(link.platform, styles),
          icon: getSocialIcon(link.platform),
          url: link.url,
        })),
    [normalizedSocialLinks]
  );

  const serviceCollections = useMemo(() => {
    const mappedCollections = sortByOrder(serviceCollectionsPayload)
      .filter((collection) => collection?.is_visible !== false)
      .map((collection, collectionIndex) => {
        const services = sortByOrder(collection?.StoreCollectionServices).map((entry, index) =>
          buildServiceDisplayItem(resolveCollectionService(entry), index + collectionIndex)
        );
        return buildCollectionCard(
          collection?.collection_name || `Service Collection ${collectionIndex + 1}`,
          services,
          "Service"
        );
      })
      .filter((collection) => collection.services.length);

    const ungroupedServices = sortByOrder(servicesNotInCollections).map((service, index) =>
      buildServiceDisplayItem(service, index + mappedCollections.length)
    );

    if (ungroupedServices.length) {
      mappedCollections.push(buildCollectionCard("Other Services", ungroupedServices, "Service"));
    }

    return mappedCollections;
  }, [serviceCollectionsPayload, servicesNotInCollections]);

  const productCollections = useMemo(() => {
    const mappedCollections = sortByOrder(productCollectionsPayload)
      .filter((collection) => collection?.is_visible !== false)
      .map((collection, collectionIndex) => {
        const products = sortByOrder(collection?.StoreCollectionProducts).map((entry, index) =>
          buildProductDisplayItem(entry?.Product, index + collectionIndex)
        );
        return buildCollectionCard(
          collection?.collection_name || `Product Collection ${collectionIndex + 1}`,
          products,
          "Product"
        );
      })
      .filter((collection) => collection.products.length);

    const ungroupedProducts = sortByOrder(productsNotInCollections).map((product, index) =>
      buildProductDisplayItem(product, index + mappedCollections.length)
    );

    if (ungroupedProducts.length) {
      mappedCollections.push(buildCollectionCard("Other Products", ungroupedProducts, "Product"));
    }

    return mappedCollections;
  }, [productCollectionsPayload, productsNotInCollections]);

  const allProductsCollection = useMemo(
    () => buildAllProductsCollection(productCollections),
    [productCollections]
  );

  const updateScrollHint = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el || isNestedView) {
      setShowScrollHint(false);
      return;
    }
    const maxScroll = el.scrollHeight - el.clientHeight;
    const canScroll = maxScroll > 8;
    const atBottom = el.scrollTop >= maxScroll - 4;
    setShowScrollHint(canScroll && !atBottom);
  }, [isNestedView]);

  const handleScrollableScroll = React.useCallback(() => {
    updateScrollHint();
  }, [updateScrollHint]);

  useEffect(() => {
    if (isNestedView) {
      setShowScrollHint(false);
      return;
    }
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = 0;
    const raf = requestAnimationFrame(() => updateScrollHint());
    return () => cancelAnimationFrame(raf);
  }, [activeTab, isNestedView, updateScrollHint]);

  useEffect(() => {
    if (!scrollRef.current || isNestedView) return;
    const raf = requestAnimationFrame(() => updateScrollHint());
    return () => cancelAnimationFrame(raf);
  }, [isNestedView, serviceCollections.length, productCollections.length, updateScrollHint]);

  useEffect(() => {
    const handleResize = () => updateScrollHint();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollHint]);

  const productDetailsPayload = productDetails?.data?.product ?? null;
  const selectedProductId = selectedProduct?.id ?? null;
  const hasMatchingProductDetails = Boolean(
    productDetailsPayload &&
      (!selectedProductId || productDetailsPayload?.id === selectedProductId)
  );
  const showProductDetailLoader = Boolean(
    selectedProductId &&
      activeTab === "shop" &&
      productDetailLoadingId === selectedProductId &&
      !hasMatchingProductDetails
  );
  const detailProduct = useMemo(() => {
    if (!selectedProduct) return null;
    if (!hasMatchingProductDetails) return selectedProduct;
    return {
      id: productDetailsPayload?.id ?? selectedProduct?.id,
      title:
        productDetailsPayload?.name ||
        productDetailsPayload?.title ||
        selectedProduct?.title ||
        "Product",
      description:
        productDetailsPayload?.description ||
        productDetailsPayload?.short_description ||
        selectedProduct?.description ||
        "",
      price:
        formatNaira(productDetailsPayload?.price) ||
        selectedProduct?.price ||
        "Contact for price",
      image:
        productDetailsPayload?.image_url ||
        productDetailsPayload?.image ||
        selectedProduct?.image,
      sku: productDetailsPayload?.sku,
      category: productDetailsPayload?.category,
      stock: productDetailsPayload?.stock,
      lowStockThreshold: productDetailsPayload?.low_stock_threshold,
      barcode: productDetailsPayload?.barcode,
      variations: Array.isArray(productDetailsPayload?.variations)
        ? productDetailsPayload.variations
        : [],
    };
  }, [hasMatchingProductDetails, productDetailsPayload, selectedProduct]);

  const isDetailProductInCart = useMemo(() => {
    const productId = detailProduct?.id ?? selectedProduct?.id;
    if (!productId) return false;
    return cartItems.some((item) => item?.id === productId);
  }, [cartItems, detailProduct?.id, selectedProduct?.id]);

  const handleSelectProduct = (product) => {
    const productId = product?.id ?? null;
    setProductDetailLoadingId(productId);
    setSelectedProduct(product);
  };

  const handleCloseProductDetail = () => {
    setProductDetailLoadingId(null);
    setSelectedProduct(null);
  };

  const handleAddToCart = (product, quantity, selection) => {
    if (!product) return;
    const safeQuantity = Math.max(1, Number(quantity) || 1);
    const itemId = product.id || product.title || `product-${Date.now()}`;
    const normalizedSelection =
      selection && typeof selection === "object"
        ? selection
        : { label: selection || "", variationId: null, variationOptionId: null };
    const selectedOptions = Array.isArray(normalizedSelection.selections)
      ? normalizedSelection.selections
          .map((entry) => ({
            variationId: entry?.variationId ?? null,
            variationName: entry?.variationName || "Variation",
            optionId: entry?.optionId ?? null,
            optionLabel: entry?.optionLabel || "",
          }))
          .filter((entry) => entry.optionLabel)
      : [];
    const sizeLabel =
      normalizedSelection.sizeLabel ||
      findVariationValue(selectedOptions, "size") ||
      normalizedSelection.label ||
      "";
    const colorLabel =
      normalizedSelection.colorLabel || findVariationValue(selectedOptions, ["color", "colour"]);
    const { variationId, variationOptionId } =
      normalizedSelection.variationId || normalizedSelection.variationOptionId
        ? {
            variationId: normalizedSelection.variationId ?? null,
            variationOptionId: normalizedSelection.variationOptionId ?? null,
          }
        : resolveVariationSelection(product, normalizedSelection.label);
    const nextItem = {
      id: itemId,
      product_id: product.id ?? product.product_id ?? null,
      title: product.title || "Product",
      image: product.image,
      priceLabel: normalizedSelection.priceLabel || product.price || "",
      unitPrice:
        normalizedSelection.priceValue !== undefined && normalizedSelection.priceValue !== null
          ? normalizedSelection.priceValue
          : parseAmount(product.price),
      size: sizeLabel,
      color: colorLabel,
      selectedOptions,
      variation_id: variationId,
      variation_option_id: variationOptionId,
      quantity: safeQuantity,
    };
    const nextItemSignature = getCartItemVariantSignature(nextItem);
    const alreadyInCart = cartItems.some(
      (item) => item?.id === itemId && getCartItemVariantSignature(item) === nextItemSignature
    );
    if (alreadyInCart) {
      Swal.fire({
        icon: "info",
        title: "Already in cart",
        text: "This product with the selected options is already in your cart.",
        confirmButtonText: "Ok",
        confirmButtonColor: customerThemeStyle["--customer-home-button"],
      });
      return;
    }

    setCartItems((prev) => {
      const items = Array.isArray(prev) ? [...prev] : [];
      items.push(nextItem);
      writeCartItems(items);
      return items;
    });
  };

  const handleViewCart = () => {
    navigate("/customer/checkout");
  };

  // useEffect(() => {
  //   if (!resolvedTenantId || activeTab !== "shop" || !selectedProduct?.id) return;
  //   dispatch(
  //     getProductDetails({
  //       tenant_id: resolvedTenantId,
  //       token,
  //       store: getStoreName,
  //       productId: selectedProduct.id,
  //     })
  //   );
  // }, [dispatch, resolvedTenantId, activeTab, selectedProduct, token, getStoreName]);


  // useEffect(() => {
  //   if (showProducts) {
  //     setActiveTab((current) => (current === "shop" || !showServices ? "shop" : current));
  //     return;
  //   }
  //   if (showServices) {
  //     setActiveTab("services");
  //   }
  // }, [showProducts, showServices]);

  // useEffect(() => {
  //   if (resolvedTenantId) {
  //     dispatch(updateBookingField({ field: "tenant_id", value: resolvedTenantId }));
  //   }
  // }, [dispatch, resolvedTenantId]);

  useEffect(() => {
    if (!resolvedTenantId || activeTab !== "shop" || !selectedProduct?.id) return;
    const requestedProductId = selectedProduct.id;
    let isCancelled = false;
    setProductDetailLoadingId(requestedProductId);

    dispatch(
      getProductDetails({
        tenant_id: '21',
        token,
        store: 'stride',
        productId: selectedProduct.id,
      })
    ).finally(() => {
      if (isCancelled) return;
      setProductDetailLoadingId((currentId) =>
        currentId === requestedProductId ? null : currentId
      );
    });

    return () => {
      isCancelled = true;
    };
  }, [dispatch, '21', activeTab, selectedProduct, token, 'stride']);


  useEffect(() => {
    if (showServices) {
      setActiveTab((current) => (current === "services" || !showProducts ? "services" : current));
      return;
    }
    if (showProducts) {
      setActiveTab("shop");
    }
  }, [showProducts, showServices]);

  useEffect(() => {
    if (resolvedTenantId) {
      dispatch(updateBookingField({ field: "tenant_id", value: '21' }));
    }
  }, [dispatch, '21']);

  useEffect(() => {
    if (!bookingPayload?.callback_url) {
      if (typeof window === "undefined") return;
      const callbackUrl = `${window.location.origin}/customer/payment-callback`;
      dispatch(updateBookingField({ field: "callback_url", value: callbackUrl }));
    }
  }, [dispatch, bookingPayload?.callback_url]);

  useEffect(() => {
    let shouldShow = false;
    try {
      const params = new URLSearchParams(location.search);
      const queryFlag = params.get("showBooking") === "1";
      const sessionFlag = sessionStorage.getItem(SHOW_BOOKING_KEY) === "true";
      const localFlag = localStorage.getItem(SHOW_BOOKING_KEY) === "true";
      shouldShow = queryFlag || sessionFlag || localFlag;
    } catch {
      shouldShow = false;
    }
    if (!shouldShow) return;

    try {
      const pendingRaw =
        sessionStorage.getItem(PENDING_BOOKING_KEY) || localStorage.getItem(PENDING_BOOKING_KEY);
      if (!pendingRaw) return;
      const pending = JSON.parse(pendingRaw);
      if (pending?.service) {
        setConfirmedBooking({
          service: pending.service,
          scheduledAt: pending.scheduledAt || "",
          timezone: pending.timezone || defaultTimeZone,
          locationType: pending.locationType || "in_person",
        });
      }
    } catch {
      // Ignore parsing/storage errors
    } finally {
      try {
        localStorage.removeItem(SHOW_BOOKING_KEY);
        localStorage.removeItem(PENDING_BOOKING_KEY);
        sessionStorage.removeItem(SHOW_BOOKING_KEY);
        sessionStorage.removeItem(PENDING_BOOKING_KEY);
      } catch {
        // Ignore storage errors
      }
    }
  }, [defaultTimeZone, location.search]);

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
      setVisibleBookingMonth(minBookingMonth);
      return;
    }
    if (bookingMetadata?.scheduled_at) {
      setBookingDate(toDateInputValue(bookingMetadata.scheduled_at));
      setBookingTimeSlot(toTimeInputValue(bookingMetadata.scheduled_at));
    } else {
      setBookingDate("");
      setBookingTimeSlot("");
    }
    const visibleDate = createDateFromInputValue(toDateInputValue(bookingMetadata?.scheduled_at)) || todayDate;
    setVisibleBookingMonth(new Date(visibleDate.getFullYear(), visibleDate.getMonth(), 1));
  }, [bookingService, bookingMetadata?.scheduled_at, minBookingMonth, todayDate]);

  useEffect(() => {
    if (!bookingDate || !bookingTimeSlot) {
      dispatch(updateBookingMetadataField({ field: "scheduled_at", value: "" }));
      return;
    }
    const isoValue = buildScheduledAt(bookingDate, bookingTimeSlot);
    dispatch(updateBookingMetadataField({ field: "scheduled_at", value: isoValue }));
  }, [dispatch, bookingDate, bookingTimeSlot]);

  useEffect(() => {
    if (!hasAvailability || !bookingDate) {
      setAvailabilityError("");
      return;
    }
    const selectedDate = createDateFromInputValue(bookingDate);
    if (!selectedDate || !isBookingDateSelectable(selectedDate) || !selectedDayAvailability?.available) {
      setAvailabilityError("Selected day is not available for this service.");
      return;
    }
    setAvailabilityError("");
  }, [bookingDate, hasAvailability, isBookingDateSelectable, selectedDayAvailability]);

  const handleBookService = async () => {
    if (!bookingService) return;
    const amountValue = parseAmount(bookingService?.price ?? bookingMeta.price);
    const callbackUrl = `${window.location.origin}/customer/payment-callback`;
    const payload = {
      ...bookingPayload,
      amount: bookingPayload?.amount ?? amountValue ?? 0,
      email: bookingPayload?.email || bookingMetadata?.customer_email || "",
      tenant_id: bookingPayload?.tenant_id || resolvedTenantId,
      callback_url: bookingPayload?.callback_url || callbackUrl,
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
      const authorizationUrl = result?.payload?.data?.authorization_url;
      if (authorizationUrl) {
        const pendingBooking = {
          service: bookingService
            ? {
                id: bookingService.id,
                title: bookingService.title,
              }
            : null,
          scheduledAt: payload.metadata.scheduled_at,
          timezone: payload.metadata.timezone,
          locationType: payload.metadata.location_type,
        };
        try {
          const serializedBooking = JSON.stringify(pendingBooking);
          localStorage.setItem(PENDING_BOOKING_KEY, serializedBooking);
          sessionStorage.setItem(PENDING_BOOKING_KEY, serializedBooking);
          localStorage.setItem(PAYMENT_CONTEXT_KEY, "booking");
          sessionStorage.setItem(PAYMENT_CONTEXT_KEY, "booking");
          localStorage.removeItem(SHOW_BOOKING_KEY);
          sessionStorage.removeItem(SHOW_BOOKING_KEY);
        } catch {
          // Ignore storage errors
        }
        window.location.assign(authorizationUrl);
        return;
      }
      const { dateLabel, timeLabel } = getScheduleLabels(payload.metadata.scheduled_at);
      const scheduleText = payload.metadata.scheduled_at
        ? `Scheduled for ${dateLabel}${timeLabel ? ` at ${timeLabel}` : ""}.`
        : "Your booking has been confirmed.";
      await Swal.fire({
        icon: "success",
        title: "Booking confirmed",
        text: scheduleText,
        confirmButtonText: "Continue",
        confirmButtonColor: customerThemeStyle["--customer-home-button"]
      });
      resetBookingForm();
      setConfirmedBooking({
        service: bookingService,
        scheduledAt: payload.metadata.scheduled_at,
        timezone: payload.metadata.timezone,
        locationType: payload.metadata.location_type,
      });
      setBookingService(null);
    } else {
      const errorMessage =
        result?.payload?.message ||
        result?.error?.message ||
        (typeof bookingError === "string" ? bookingError : bookingError?.message) ||
        "Unable to book this service right now.";
      await Swal.fire({
        icon: "error",
        title: "Booking failed",
        text: errorMessage,
        confirmButtonText: "Try Again",
        confirmButtonColor: customerThemeStyle["--customer-home-button"]
      });
    }
  };

  const resetBookingSchedule = () => {
    dispatch(updateBookingMetadataField({ field: "scheduled_at", value: "" }));
    setBookingDate("");
    setBookingTimeSlot("");
    setAvailabilityError("");
  };

  const resetBookingForm = () => {
    resetBookingSchedule();
    dispatch(updateBookingMetadataField({ field: "customer_name", value: "" }));
    dispatch(updateBookingMetadataField({ field: "customer_email", value: "" }));
    dispatch(updateBookingMetadataField({ field: "customer_phone", value: "" }));
    dispatch(updateBookingMetadataField({ field: "notes", value: "" }));
    dispatch(updateBookingMetadataField({ field: "location_type", value: "in_person" }));
    dispatch(updateBookingField({ field: "email", value: "" }));
  };

  return (
    <div className={styles.customerHomePage} style={customerThemeStyle}>
      {showStoreLoader ? (
        <div className={styles.customerHomeLoader} role="status" aria-live="polite">
          <img
            className={styles.customerHomeLoaderLogo}
            src={storeLogo}
            alt=""
            aria-hidden="true"
          />
          <div className={styles.customerHomeLoaderText}>
            <span>Preparing store</span>
            <small>Loading products and services</small>
          </div>
        </div>
      ) : null}
      <div
        className={`${styles.customerHomeContent} ${
          isNestedView ? styles.customerHomeContentDetail : ""
        } ${!isNestedView ? styles.customerHomeContentShop : ""}`}
      >
        {!isNestedView ? (
          <div className={styles.customerHomeTopbar}>
            <div className={`${styles.customerHomeShopBrand} ${styles.customerHomeTopBrand}`}>
              <img className={styles.customerHomeShopBrandLogo} src={storeLogo} alt={storeName} />
              <div className={styles.customerHomeShopBrandText}>
                <span className={styles.customerHomeShopBrandName}>{storeName}</span>
                <span className={styles.customerHomeShopBrandMeta}>{sectionTitle}</span>
              </div>
            </div>

            {showServices && showProducts ? (
              <div className={styles.customerHomeSegment} role="tablist" aria-label="Store sections">
                <Button
                  className={`${styles.customerHomeSegmentButton} ${
                    activeTab === "shop" ? styles.customerHomeSegmentActive : ""
                  }`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "shop"}
                  onClick={() => {
                    setSelectedProductCollection(null);
                    setSelectedServiceCollection(null);
                    handleCloseProductDetail();
                    setActiveService(null);
                    setBookingService(null);
                    resetBookingSchedule();
                    setActiveTab("shop");
                  }}
                  unstyled
                >
                  Shop
                </Button>
                <Button
                  className={`${styles.customerHomeSegmentButton} ${
                    activeTab === "services" ? styles.customerHomeSegmentActive : ""
                  }`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "services"}
                  onClick={() => {
                    handleCloseProductDetail();
                    setSelectedProductCollection(null);
                    setSelectedServiceCollection(null);
                    setActiveService(null);
                    setBookingService(null);
                    resetBookingSchedule();
                    setActiveTab("services");
                  }}
                  unstyled
                >
                  Services
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div
          className={`${styles.customerHomeScrollable} ${
            isNestedView ? styles.customerHomeScrollableDetail : ""
          }`}
          ref={scrollRef}
          onScroll={handleScrollableScroll}
        >
          {!showServices && !showProducts ? (
            <div className={styles.customerHomeEmptyState}>
              <p className={styles.customerHomeEmptyTitle}>Nothing to display</p>
              <p className={styles.customerHomeEmptyText}>
                This store has hidden both products and services for now.
              </p>
            </div>
          ) : activeTab === "services" && showServices ? (
            activeService ? (
              <ServiceDetailView
                key={activeService?.id || activeService?.title || "service-detail"}
                service={activeService}
                storeName={storeName}
                shareOptions={shareOptions}
                onBack={() => setActiveService(null)}
                onBook={() => {
                  setBookingService(activeService);
                  resetBookingSchedule();
                }}
              />
            ) : selectedServiceCollection ? (
              <ServiceCollectionDetailView
                collection={selectedServiceCollection}
                onBack={() => setSelectedServiceCollection(null)}
                onSelectService={(service) => setActiveService(service)}
              />
            ) : (
            <>
              {serviceCollections.length ? (
                <ServiceCollectionsLanding
                  collections={serviceCollections}
                  sectionTitle={sectionTitle}
                  onSelectCollection={(collection) => setSelectedServiceCollection(collection)}
                  onSelectService={(service) => setActiveService(service)}
                  onViewCart={handleViewCart}
                  storeLogo={storeLogo}
                  storeBannerImage={storeBannerImage}
                  storeName={storeName}
                  storeDescription={visibleStoreDescription}
                  cartCount={cartCount}
                />
              ) : (
                <div className={styles.customerHomeEmptyState}>
                  <p className={styles.customerHomeEmptyTitle}>No services available</p>
                  <p className={styles.customerHomeEmptyText}>
                    Please check back soon for updated offerings.
                  </p>
                </div>
              )}
            </>
            )
          ) : selectedProduct ? (
            showProductDetailLoader ? (
              <ProductDetailLoader storeLogo={storeLogo} storeName={storeName} />
            ) : (
            <ProductDetailView
              key={`${detailProduct?.id || selectedProduct?.id || "product-detail"}-${
                detailProduct?.variations?.length || selectedProduct?.variations?.length || 0
              }-${detailProduct?.image || selectedProduct?.image || ""}`}
              product={detailProduct || selectedProduct}
              onBack={handleCloseProductDetail}
              storeName={storeName}
              cartCount={cartCount}
              onAddToCart={handleAddToCart}
              onViewCart={handleViewCart}
              isInCart={isDetailProductInCart}
            />
            )
          ) : selectedProductCollection ? (
            <CollectionDetailView
              key={selectedProductCollection?.id || selectedProductCollection?.title || "product-collection"}
              collection={selectedProductCollection}
              onBack={() => setSelectedProductCollection(null)}
              onSelectProduct={handleSelectProduct}
              storeLogo={storeLogo}
              storeName={storeName}
            />
          ) : (
            <div className={styles.customerHomeCollections}>
              {productCollections.length ? (
                <ProductCollectionsLanding
                  collections={productCollections}
                  sectionTitle={sectionTitle}
                  onSelectCollection={(collection) => setSelectedProductCollection(collection)}
                  onSelectProduct={handleSelectProduct}
                  onViewCart={handleViewCart}
                  onViewAllProducts={
                    allProductsCollection
                      ? () => setSelectedProductCollection(allProductsCollection)
                      : null
                  }
                  storeLogo={storeLogo}
                  storeBannerImage={storeBannerImage}
                  storeName={storeName}
                  storeDescription={visibleStoreDescription}
                  cartCount={cartCount}
                />
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
          {!isDetailView ? (
            <CustomerStoreFooter
              storeName={storeName}
              storeDescription={storeDescription}
              socialLinks={normalizedSocialLinks}
              addresses={footerAddresses}
              hours={footerHours}
              showProducts={showProducts}
              showServices={showServices}
              onShopAll={() => {
                setActiveTab("shop");
                handleCloseProductDetail();
                setSelectedProductCollection(null);
                setSelectedServiceCollection(null);
                setActiveService(null);
                setBookingService(null);
                resetBookingSchedule();
              }}
              onServices={() => {
                setActiveTab("services");
                handleCloseProductDetail();
                setSelectedProductCollection(null);
                setSelectedServiceCollection(null);
                setActiveService(null);
                setBookingService(null);
                resetBookingSchedule();
              }}
              onViewCart={handleViewCart}
            />
          ) : null}
          {!isNestedView && showScrollHint && (
            <div className={styles.customerHomeScrollHint} aria-hidden="true">
              <span className={styles.customerHomeScrollHintArrow}>↓</span>
            </div>
          )}
        </div>

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
                      type="text"
                      value={bookingDate ? formatDateDisplayValue(bookingDate) : ""}
                      placeholder={
                        hasAvailability ? "Select an available date" : "Select a booking date"
                      }
                      readOnly
                    />
                  </div>
                  <div className={styles.customerHomeBookingCalendar}>
                    <div className={styles.customerHomeBookingCalendarHeader}>
                      <Button
                        className={styles.customerHomeBookingCalendarNav}
                        type="button"
                        onClick={() => setVisibleBookingMonth((prev) => shiftMonth(prev, -1))}
                        disabled={!canGoToPreviousBookingMonth}
                        unstyled
                      >
                        ‹
                      </Button>
                      <span className={styles.customerHomeBookingCalendarMonth}>
                        {bookingMonthLabel}
                      </span>
                      <Button
                        className={styles.customerHomeBookingCalendarNav}
                        type="button"
                        onClick={() => setVisibleBookingMonth((prev) => shiftMonth(prev, 1))}
                        unstyled
                      >
                        ›
                      </Button>
                    </div>
                    <div className={styles.customerHomeBookingCalendarWeekdays}>
                      {WEEKDAY_LABELS.map((day) => (
                        <span key={day} className={styles.customerHomeBookingCalendarWeekday}>
                          {day}
                        </span>
                      ))}
                    </div>
                    <div className={styles.customerHomeBookingCalendarGrid}>
                      {bookingCalendarDays.map((day) => {
                        const isSelected = bookingDate === day.iso;
                        return (
                          <Button
                            key={day.iso}
                            className={`${styles.customerHomeBookingCalendarDay} ${
                              !day.isCurrentMonth ? styles.customerHomeBookingCalendarDayMuted : ""
                            } ${
                              day.isSelectable ? styles.customerHomeBookingCalendarDayAvailable : ""
                            } ${
                              isSelected ? styles.customerHomeBookingCalendarDaySelected : ""
                            }`}
                            type="button"
                            disabled={!day.isSelectable}
                            onClick={() => {
                              setBookingDate(day.iso);
                              setBookingTimeSlot("");
                              setAvailabilityError("");
                            }}
                            unstyled
                          >
                            {day.dayLabel}
                          </Button>
                        );
                      })}
                    </div>
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
                  Pay securely with Paystack
                </p>
                <div className={styles.customerHomeBookingTotalRow}>
                  <span>Total</span>
                  <span>{bookingAmountLabel}</span>
                </div>
                <div className={styles.customerHomeBookingPaymentRow}>
                  <Button
                    className={`${styles.customerHomeBookingPaymentButton} ${styles.customerHomeBookingPaymentActive}`}
                    type="button"
                    aria-pressed="true"
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
                    className={`${styles.customerHomeBookingSubmit} ${styles.customerHomeBookingSubmitInline}`}
                    type="button"
                    onClick={handleBookService}
                    disabled={bookingLoading || !isScheduleValid}
                    unstyled
                  >
                    {bookingLoading ? "Booking..." : "Pay and Book Appointment"}
                  </Button>
                </div>
                {bookingError && (
                  <p className={styles.customerHomeBookingSubtle}>
                    {typeof bookingError === "string"
                      ? bookingError
                      : bookingError?.message || "Unable to book this service right now."}
                  </p>
                )}
                <p className={styles.customerHomeBookingFinePrint}>
                  By clicking the Paystack payment button, you agree to make your
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
              handleCloseProductDetail();
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

      </div>
    </div>
  );
};

export default CustomersHome;
