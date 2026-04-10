import { API_URL } from "../config/constant";

const BACKEND_ORIGIN = new URL(API_URL).origin;

const sanitizeBase64Payload = (payload = "") => {
  const cleanedPayload = payload.replace(/[^A-Za-z0-9+/=]/g, "");
  const paddingRemainder = cleanedPayload.length % 4;

  if (paddingRemainder === 0) {
    return cleanedPayload;
  }

  return cleanedPayload.padEnd(cleanedPayload.length + (4 - paddingRemainder), "=");
};

const normalizeDataImage = (value) => {
  const dataImageIndex = value.indexOf("data:image");

  if (dataImageIndex >= 0) {
    const normalizedValue = value.slice(dataImageIndex).replace(/\s+/g, "");
    const [metadata, payload = ""] = normalizedValue.split(",");

    if (!metadata || !payload) {
      return normalizedValue;
    }

    return `${metadata},${sanitizeBase64Payload(payload)}`;
  }

  if (value.includes("base64,")) {
    const [, payload = ""] = value.split("base64,");
    const cleanPayload = sanitizeBase64Payload(payload);

    if (cleanPayload) {
      return `data:image/png;base64,${cleanPayload}`;
    }
  }

  return "";
};

export const getImageSrc = (value = "") => {
  if (!value || typeof value !== "string") {
    return "";
  }

  const trimmedValue = value.trim();
  const normalizedDataImage = normalizeDataImage(trimmedValue);

  if (normalizedDataImage) {
    return normalizedDataImage;
  }

  if (/^(https?:|data:|blob:|\/\/)/i.test(trimmedValue)) {
    return trimmedValue;
  }

  if (trimmedValue.startsWith("/")) {
    return `${BACKEND_ORIGIN}${trimmedValue}`;
  }

  if (trimmedValue.startsWith("uploads/")) {
    return `${BACKEND_ORIGIN}/${trimmedValue}`;
  }

  return trimmedValue;
};
