import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendDown,
  faArrowTrendUp,
  faBagShopping,
  faBoxOpen,
  faCartShopping,
  faCaretDown,
  faCircleExclamation,
  faEllipsisVertical,
  faEyeSlash,
  faMagnifyingGlass,
  faPen,
  faPlus,
  faTimes,
  faTrashCan,
  faUpload,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { Ac } from "../../../assets";
import Button from "../../../components/ui/Button";
import Pagination from "../../../components/Pagination";
import { logProductSubmissionPayload } from "../../../utils/logProductSubmissionPayload";
import ProductFormDesigner from "../../components/ProductFormDesigner";
import {
  createProduct,
  deleteProductFromStore,
  getAllProductForCollection,
  getProductDetails,
  publishProductToStore,
  unpublishProductToStore,
  updateProduct,
} from "../../../slice/onlineStoreSlice";
import styles from "../../../styles.module.css";

const PRODUCTS_PER_PAGE = 20;
const DEFAULT_CATEGORIES = ["Electronics", "Clothing", "Home & Garden", "Sports"];
const shouldRenderLegacyProductModal = false;
const VARIATION_TYPE_LABELS = {
  color: "Color",
  colour: "Color",
  size: "Size",
  material: "Material",
  style: "Style",
  weight: "Weight",
  other: "Other",
  custom: "Other",
};

const createEmptyVariation = () => ({
  variation_name: "",
  variation_type: "",
  is_required: false,
  options: [],
});

const createEmptyOption = () => ({
  value: "",
  display_name: "",
  price: "",
  stock: "",
  sku: null,
  image_url: "",
  is_default: false,
  imageFile: null,
});

const createEmptyVariant = () => ({
  sku: "",
  price: "",
  stock: "",
  image_url: "",
  imageFile: null,
  enabled: true,
  options: [],
  combination: "",
});

const normalizeVariationType = (value = "") => {
  const normalizedValue = String(value).trim().toLowerCase();
  if (normalizedValue === "colour") return "color";
  if (normalizedValue === "custom") return "other";
  return normalizedValue;
};

const inferVariationType = (value = "") => {
  const normalizedValue = normalizeVariationType(value);

  if (!normalizedValue) return "";
  if (VARIATION_TYPE_LABELS[normalizedValue]) return normalizedValue;
  if (normalizedValue.includes("color") || normalizedValue.includes("colour")) return "color";
  if (normalizedValue.includes("size")) return "size";
  if (normalizedValue.includes("material") || normalizedValue.includes("fabric")) return "material";
  if (normalizedValue.includes("style")) return "style";
  if (normalizedValue.includes("weight")) return "weight";

  return "";
};

const resolveVariationType = (typeValue = "", nameValue = "") =>
  inferVariationType(typeValue) || inferVariationType(nameValue) || (typeValue || nameValue ? "other" : "");

const getVariationTypeLabel = (value = "") =>
  VARIATION_TYPE_LABELS[normalizeVariationType(value)] || value;

const toSkuToken = (value = "") => {
  const normalizedValue = String(value)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalizedValue || "OPT";
};

const resolveVariantSku = (skuSegments = [], baseSku = "") => {
  const normalizedBaseSku = toSkuToken(baseSku || "SKU");

  return skuSegments.reduce((currentSku, segment) => {
    const segmentValue = String(segment?.value || "").trim().toUpperCase();

    if (!segment?.isExplicit) {
      return currentSku ? `${currentSku}-${toSkuToken(segmentValue)}` : toSkuToken(segmentValue);
    }

    if (!segmentValue) {
      return currentSku || normalizedBaseSku;
    }

    if (!currentSku || segmentValue === currentSku || segmentValue.startsWith(`${currentSku}-`)) {
      return segmentValue;
    }

    const explicitSuffix = segmentValue.split("-").filter(Boolean).pop() || toSkuToken(segmentValue);
    return `${currentSku}-${explicitSuffix}`;
  }, normalizedBaseSku);
};

const readStoredProducts = () => {
  if (typeof window === "undefined") return [];

  try {
    const rawProducts = localStorage.getItem("products");
    if (!rawProducts) return [];

    const parsedProducts = JSON.parse(rawProducts);
    return Array.isArray(parsedProducts) ? parsedProducts : [];
  } catch {
    return [];
  }
};

const parseMaybeJson = (value) => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const resolveProductId = (product, index) =>
  product?.id ||
  product?.product_id ||
  product?.sku ||
  `${index + 1}`;

const resolveProductName = (product) =>
  product?.name || product?.product_name || "Untitled product";

const resolveProductDescription = (product) =>
  product?.description || product?.product_description || "No description provided.";

const resolveProductSku = (product) => product?.sku || "N/A";

const resolveProductCategory = (product) =>
  product?.category || product?.Category?.name || "Uncategorized";

const resolveProductPrice = (product) => {
  const numericPrice = Number(product?.price ?? product?.unit_price ?? 0);
  return Number.isFinite(numericPrice) ? numericPrice : 0;
};

const resolveProductStock = (product) => {
  const numericStock = Number(product?.stock ?? product?.quantity ?? 0);
  return Number.isFinite(numericStock) ? numericStock : 0;
};

const resolveProductImage = (product) =>
  product?.image_url || product?.product_image || "";

const resolveProductStatus = (product) => {
  const stock = resolveProductStock(product);
  return stock > 5 ? "in-stock" : "low-stock";
};

const formatCurrency = (amount) =>
  `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const resolveErrorMessage = (error) =>
  error?.message || error?.error || error || "Unable to load products right now.";

const normalizeDetailOption = (option = {}) => ({
  value:
    option?.value ||
    option?.option_value ||
    option?.option_display_name ||
    option?.label ||
    "Option",
  price: Number(option?.price ?? option?.price_adjustment ?? option?.price_delta ?? 0) || 0,
  stock: Number(option?.stock ?? option?.quantity ?? option?.available_stock ?? 0) || 0,
  sku: option?.sku || "",
  barcode: option?.barcode || "",
  active: option?.is_available !== 0 && option?.is_active !== false,
});

const normalizeDetailVariation = (variation = {}) => {
  const parsedOptions = parseMaybeJson(
    variation?.options ?? variation?.variation_options ?? variation?.values ?? []
  );

  return {
    name: variation?.variation_name || variation?.name || "Variation",
    type: variation?.variation_type || variation?.type || variation?.variation_name || "Option",
    options: Array.isArray(parsedOptions) ? parsedOptions.map(normalizeDetailOption) : [],
  };
};

const resolveDetailVariations = (product = {}) => {
  const parsedVariations = parseMaybeJson(
    product?.variations ??
      product?.product_variations ??
      product?.variation_groups ??
      product?.variant_groups ??
      []
  );

  return Array.isArray(parsedVariations)
    ? parsedVariations
        .map(normalizeDetailVariation)
        .filter((variation) => variation.name || variation.options.length)
    : [];
};

const buildDetailVariantRows = (variationList = [], basePrice = 0, baseSku = "") => {
  const validVariations = variationList.filter((variation) => variation.options.length > 0);
  const safeSku = (baseSku || "SKU").toString().trim().toUpperCase();

  if (!validVariations.length) return [];

  return validVariations
    .reduce((rows, variation) => {
      if (!rows.length) {
        return variation.options.map((option) => ({
          labels: [{ type: variation.type, value: option.value }],
          skuParts: [String(option.value || "").slice(0, 3).toUpperCase()],
          price: basePrice + option.price,
          stock: option.stock,
          active: option.active,
          barcode: option.barcode,
          sku: option.sku,
        }));
      }

      return rows.flatMap((row) =>
        variation.options.map((option) => ({
          labels: [...row.labels, { type: variation.type, value: option.value }],
          skuParts: [...row.skuParts, String(option.value || "").slice(0, 3).toUpperCase()],
          price: row.price + option.price,
          stock: Math.min(row.stock, option.stock),
          active: row.active && option.active,
          barcode: option.barcode || row.barcode,
          sku: option.sku || row.sku,
        }))
      );
    }, [])
    .map((row, index) => ({
      ...row,
      id: `${row.sku || safeSku}-${index}`,
      sku: row.sku || `${safeSku}-${row.skuParts.join("-")}`,
      combination: row.labels.map((label) => label.value).join(" / "),
    }));
};

const isLocalPreviewImage = (value = "") =>
  typeof value === "string" && /^(data:|blob:)/i.test(value.trim());

const normalizeFormOption = (option = {}) => ({
  value:
    option?.value ??
    option?.option_value ??
    option?.display_name ??
    option?.option_display_name ??
    "",
  display_name:
    option?.display_name ??
    option?.option_display_name ??
    option?.value ??
    option?.option_value ??
    "",
  price: option?.price ?? option?.price_adjustment ?? 0,
  stock: option?.stock ?? option?.quantity ?? 0,
  sku: option?.sku ?? null,
  image_url: option?.image_url ?? "",
  is_default:
    option?.is_default === true ||
    option?.is_default === 1 ||
    option?.is_default === "1" ||
    option?.is_default === "true",
  imageFile: option?.imageFile ?? null,
});

const normalizeFormVariation = (variation = {}) => {
  const parsedOptions = parseMaybeJson(
    variation?.options ?? variation?.variation_options ?? variation?.values ?? []
  );

  return {
    variation_name: variation?.variation_name ?? variation?.name ?? "",
    variation_type: resolveVariationType(
      variation?.variation_type ?? variation?.type ?? "",
      variation?.variation_name ?? variation?.name ?? ""
    ),
    is_required:
      variation?.is_required === true ||
      variation?.is_required === 1 ||
      variation?.is_required === "1" ||
      variation?.is_required === "true",
    options: Array.isArray(parsedOptions) ? parsedOptions.map(normalizeFormOption) : [],
  };
};

const resolveFormVariations = (variationList = []) => {
  const parsedVariations = parseMaybeJson(variationList);

  return Array.isArray(parsedVariations)
    ? parsedVariations
        .map(normalizeFormVariation)
        .filter(
          (variation) =>
            variation.variation_name || variation.variation_type || variation.options.length > 0
        )
    : [];
};

const buildVariationsPayload = (
  variationList = [],
  { clearOptionPrices = false, clearOptionStocks = false } = {}
) =>
  resolveFormVariations(variationList).map((variation) => ({
    variation_name: variation.variation_name,
    variation_type: variation.variation_type,
    is_required: variation.is_required,
    options: variation.options.map((optionEntry) => {
      const option = { ...optionEntry };
      delete option.imageFile;
      const imageUrl = isLocalPreviewImage(option?.image_url ?? "")
        ? ""
        : String(option?.image_url ?? "").trim();

      const nextOption = {
        ...option,
        price: clearOptionPrices ? 0 : option?.price,
        stock: clearOptionStocks ? 0 : option?.stock,
        display_name: option?.display_name ?? option?.value ?? "",
        sku: option?.sku ?? null,
        is_default:
          option?.is_default === true ||
          option?.is_default === 1 ||
          option?.is_default === "1" ||
          option?.is_default === "true",
      };

      if (imageUrl) {
        nextOption.image_url = imageUrl;
      } else {
        delete nextOption.image_url;
      }

      return nextOption;
    }),
  }));

const buildVariationGenerationSignature = (variationList = []) =>
  JSON.stringify(
    resolveFormVariations(variationList).map((variation) => ({
      variation_name: String(variation?.variation_name || "").trim(),
      variation_type: normalizeVariationType(variation?.variation_type || ""),
      is_required: variation?.is_required === true,
      options: (Array.isArray(variation?.options) ? variation.options : []).map((option) => ({
        value: String(option?.value || "").trim(),
        display_name: String(option?.display_name || "").trim(),
        price: Number(option?.price) || 0,
        stock: Number(option?.stock) || 0,
        sku: option?.sku ?? null,
      })),
    }))
  );

const countVariationsWithOptions = (variationList = []) =>
  resolveFormVariations(variationList).filter((variation) =>
    variation.options.some((option) => String(option?.value || "").trim())
  ).length;

const buildVariantCombinationKey = (variant = {}) =>
  String(
    variant?.combination ||
      (Array.isArray(variant?.options)
        ? variant.options.map((option) => option?.option_value || "").join(" / ")
        : "")
  ).trim();

const generateVariantsFromVariations = (
  variationList = [],
  baseSku = "",
  basePrice = "",
  existingVariants = [],
  preserveExisting = true
) => {
  const validVariations = buildVariationsPayload(variationList)
    .map((variation) => ({
      ...variation,
      options: variation.options.filter((option) => String(option?.value || "").trim()),
    }))
    .filter((variation) => variation.options.length > 0);

  if (!validVariations.length) {
    return [];
  }

  const existingVariantMap = new Map(
    (Array.isArray(existingVariants) ? existingVariants : []).map((variant) => [
      buildVariantCombinationKey(variant),
      variant,
    ])
  );
  const normalizedBasePrice = basePrice === "" ? 0 : Number(basePrice) || 0;

  return validVariations
    .reduce((rows, variation) => {
      if (!rows.length) {
        return variation.options.map((option) => ({
          labels: [option.display_name || option.value || "Option"],
          skuSegments: [
            {
              value: option?.sku || option?.value || option?.display_name || "OPT",
              isExplicit: Boolean(String(option?.sku || "").trim()),
            },
          ],
          priceAdjustment: Number(option?.price) || 0,
          stockValues: [Number(option?.stock) || 0],
          options: [
            {
              variation_name: variation.variation_name || variation.variation_type,
              option_value: option?.value || option?.display_name || "",
              display_name: option?.display_name || option?.value || "",
            },
          ],
        }));
      }

      return rows.flatMap((row) =>
        variation.options.map((option) => ({
          labels: [...row.labels, option.display_name || option.value || "Option"],
          skuSegments: [
            ...row.skuSegments,
            {
              value: option?.sku || option?.value || option?.display_name || "OPT",
              isExplicit: Boolean(String(option?.sku || "").trim()),
            },
          ],
          priceAdjustment: row.priceAdjustment + (Number(option?.price) || 0),
          stockValues: [...row.stockValues, Number(option?.stock) || 0],
          options: [
            ...row.options,
            {
              variation_name: variation.variation_name || variation.variation_type,
              option_value: option?.value || option?.display_name || "",
              display_name: option?.display_name || option?.value || "",
            },
          ],
        }))
      );
    }, [])
    .map((row) => {
      const combination = row.labels.join(" / ");
      const existingVariant = preserveExisting ? existingVariantMap.get(combination) : null;

      if (existingVariant) {
        return {
          ...createEmptyVariant(),
          ...existingVariant,
          combination,
          options: row.options,
          enabled: existingVariant?.enabled !== false,
        };
      }

      return {
        ...createEmptyVariant(),
        sku: resolveVariantSku(row.skuSegments, baseSku),
        price: normalizedBasePrice + row.priceAdjustment,
        stock: row.stockValues.length > 0 ? Math.min(...row.stockValues) : 0,
        enabled: true,
        options: row.options,
        combination,
      };
    });
};

const buildVariantsPayload = (variantList = []) => {
  return (Array.isArray(variantList) ? variantList : []).map((variantEntry) => {
    const { imageFile, ...variant } = variantEntry || {};

    return {
      ...variant,
      sku: String(variant?.sku || "").trim(),
      price: variant?.price === "" ? 0 : Number(variant?.price) || 0,
      stock: variant?.stock === "" ? 0 : Number(variant?.stock) || 0,
      image_url: isLocalPreviewImage(variant?.image_url ?? "") ? "" : variant?.image_url ?? "",
      enabled: variant?.enabled !== false,
      options: Array.isArray(variant?.options)
        ? variant.options.map((option) => ({
            variation_name: option?.variation_name ?? "",
            option_value: option?.option_value ?? "",
            display_name: option?.display_name ?? option?.option_value ?? "",
          }))
        : [],
    };
  });
};

const normalizeFormVariantOption = (option = {}) => ({
  variation_name: option?.variation_name ?? option?.name ?? option?.type ?? "",
  option_value:
    option?.option_value ??
    option?.value ??
    option?.display_name ??
    option?.option_display_name ??
    option?.label ??
    "",
  display_name:
    option?.display_name ??
    option?.option_display_name ??
    option?.option_value ??
    option?.value ??
    option?.label ??
    "",
});

const normalizeFormVariant = (variant = {}) => {
  const parsedOptions = parseMaybeJson(
    variant?.options ??
      variant?.variant_options ??
      variant?.combination_options ??
      variant?.attributes ??
      []
  );
  const normalizedOptions = Array.isArray(parsedOptions)
    ? parsedOptions
        .map(normalizeFormVariantOption)
        .filter((option) => option.variation_name || option.option_value || option.display_name)
    : [];
  const combination = String(
    variant?.combination ||
      variant?.name ||
      normalizedOptions
        .map((option) => option?.display_name || option?.option_value || "")
        .filter(Boolean)
        .join(" / ")
  ).trim();

  return {
    ...createEmptyVariant(),
    sku: variant?.sku ?? "",
    price: variant?.price ?? variant?.unit_price ?? "",
    stock: variant?.stock ?? variant?.quantity ?? variant?.available_stock ?? "",
    image_url: variant?.image_url ?? variant?.image ?? "",
    enabled:
      variant?.enabled !== false &&
      variant?.enabled !== 0 &&
      variant?.enabled !== "0" &&
      variant?.is_active !== false &&
      variant?.is_active !== 0 &&
      variant?.is_active !== "0" &&
      variant?.active !== false &&
      variant?.is_available !== 0 &&
      variant?.is_available !== "0",
    options: normalizedOptions,
    combination,
  };
};

const resolveFormVariants = (product = {}) => {
  const parsedVariants = parseMaybeJson(
    product?.variants ??
      product?.product_variants ??
      product?.variant_combinations ??
      product?.combinations ??
      product?.generated_variants ??
      []
  );

  return Array.isArray(parsedVariants)
    ? parsedVariants
        .map(normalizeFormVariant)
        .filter((variant) => variant.combination || variant.options.length > 0 || variant.sku)
    : [];
};

const snapshotVariationPricing = (variationList = []) =>
  resolveFormVariations(variationList).map((variation) => ({
    options: (Array.isArray(variation?.options) ? variation.options : []).map((option) => ({
      price: option?.price ?? "",
      stock: option?.stock ?? "",
    })),
  }));

const restoreVariationPricing = (variationList = [], snapshot = []) =>
  resolveFormVariations(variationList).map((variation, variationIndex) => ({
    ...variation,
    options: (Array.isArray(variation?.options) ? variation.options : []).map((option, optionIndex) => ({
      ...option,
      price: snapshot?.[variationIndex]?.options?.[optionIndex]?.price ?? option?.price ?? "",
      stock: snapshot?.[variationIndex]?.options?.[optionIndex]?.stock ?? option?.stock ?? "",
    })),
  }));

const clearVariationPricing = (variationList = []) =>
  resolveFormVariations(variationList).map((variation) => ({
    ...variation,
    options: (Array.isArray(variation?.options) ? variation.options : []).map((option) => ({
      ...option,
      price: "",
      stock: "",
    })),
  }));

const getProductFormMode = (variationList = [], variantList = []) => {
  const hasVariations = resolveFormVariations(variationList).length > 0;
  const hasVariants = Array.isArray(variantList) && variantList.length > 0;

  if (hasVariants) {
    return "variants";
  }

  if (hasVariations) {
    return "variations";
  }

  return "simple";
};

const isVariationReadyForSubmit = (variation = {}) => {
  const normalizedVariation = normalizeFormVariation(variation);

  return Boolean(
    normalizedVariation.variation_name &&
      normalizedVariation.variation_type &&
      normalizedVariation.options.length > 0
  );
};

const hasVariationDraft = (variation = {}, option = {}) => {
  const hasVariationFields = Boolean(
    variation?.variation_name ||
      variation?.variation_type ||
      (Array.isArray(variation?.options) && variation.options.length > 0)
  );

  const hasOptionFields = Boolean(
    option?.value ||
      option?.display_name ||
      option?.price !== "" ||
      option?.stock !== "" ||
      option?.sku ||
      option?.image_url
  );

  return hasVariationFields || hasOptionFields;
};

const buildSubmitVariations = (variationList = [], currentVariation = {}) =>
  isVariationReadyForSubmit(currentVariation)
    ? [...variationList, currentVariation]
    : variationList;

const extractDetailedProduct = (payload, fallbackProduct = {}) => {
  const candidates = [
    payload?.data?.product,
    payload?.product,
    payload?.data?.data?.product,
    payload?.data,
  ];

  return (
    candidates.find(
      (candidate) =>
        candidate &&
        typeof candidate === "object" &&
        (candidate.id || candidate.name || candidate.sku)
    ) || fallbackProduct
  );
};

const buildVariationDraft = (variation = {}) => {
  const normalizedVariation = normalizeFormVariation(variation);

  return {
    ...normalizedVariation,
    variation_name:
      normalizedVariation.variation_name ||
      (normalizedVariation.variation_type === "custom"
        ? ""
        : getVariationTypeLabel(normalizedVariation.variation_type)),
  };
};

const buildVariantPreviewRows = (variationList = [], baseSku = "", basePrice = "") => {
  const validVariations = buildVariationsPayload(variationList).filter(
    (variation) => variation.options.length > 0
  );

  if (!validVariations.length) {
    return [];
  }

  return validVariations
    .reduce((rows, variation) => {
      if (!rows.length) {
        return variation.options.map((option) => ({
          labels: [option.value || option.display_name || "Option"],
          skuSegments: [
            {
              value: option?.sku || option?.value || option?.display_name || "OPT",
              isExplicit: Boolean(String(option?.sku || "").trim()),
            },
          ],
          price: Number(option?.price) || 0,
          stock: Number(option?.stock) || 0,
          image_url: option?.image_url || "",
          options: [
            {
              variation_name: variation.variation_name || variation.variation_type,
              option_value: option?.value || option?.display_name || "",
            },
          ],
        }));
      }

      return rows.flatMap((row) =>
        variation.options.map((option) => ({
          labels: [...row.labels, option.value || option.display_name || "Option"],
          skuSegments: [
            ...row.skuSegments,
            {
              value: option?.sku || option?.value || option?.display_name || "OPT",
              isExplicit: Boolean(String(option?.sku || "").trim()),
            },
          ],
          price: row.price + (Number(option?.price) || 0),
          stock: Math.min(row.stock, Number(option?.stock) || 0),
          image_url: row.image_url || option?.image_url || "",
          options: [
            ...row.options,
            {
              variation_name: variation.variation_name || variation.variation_type,
              option_value: option?.value || option?.display_name || "",
            },
          ],
        }))
      );
    }, [])
    .map((row) => ({
      combination: row.labels.join(" / "),
      labels: row.labels,
      sku: resolveVariantSku(row.skuSegments, baseSku),
      price: row.price,
      stock: row.stock,
      image_url: row.image_url,
      options: row.options,
    }));
};

const summarizeVariantRows = (variantRows = [], fallbackPrice = "", fallbackStock = "") => {
  if (!variantRows.length) {
    return {
      price: Number(fallbackPrice) || 0,
      stock: Number(fallbackStock) || 0,
    };
  }

  return {
    price: Math.min(...variantRows.map((variant) => Number(variant.price) || 0)),
    stock: variantRows.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0),
  };
};

const generateSKU = (name) => {
  if (!name.trim()) return "";

  const prefix = name.trim().substring(0, 6).toUpperCase();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";

  for (let index = 0; index < 3; index += 1) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${prefix}-${randomPart}`;
};

const dropStyles = {
  container: {
    width: "100%",
    margin: "auto",
    padding: "2rem",
    borderRadius: "12px",
    border: "1px dashed #ddd",
    textAlign: "center",
    backgroundColor: "#fff",
  },
  imageWrapper: {
    cursor: "pointer",
    display: "inline-block",
  },
  imageCircle: {
    width: "200px",
    height: "150px",
    margin: "auto",
    borderRadius: "2%",
    overflow: "hidden",
    backgroundColor: "#ddd",
    marginBottom: "1rem",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  placeholderCircle: {
    width: "100%",
    height: "100%",
    backgroundColor: "#D9D9D9",
  },
  uploadBtn: {
    padding: "8px 16px",
    backgroundColor: "#fff",
    border: "1px solid #EEEEEE",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
    color: "#0273F9",
  },
  note: {
    fontSize: "12px",
    color: "#78716C",
    marginTop: "1rem",
  },
};

const resolveApiErrorMessage = (error) => {
  if (!error) return "Something went wrong";
  if (Array.isArray(error)) {
    return error.map((item) => item?.message || item).join(", ");
  }
  if (typeof error === "string") {
    return error;
  }
  if (error.message) {
    return error.message;
  }
  if (error.response?.data) {
    const responseData = error.response.data;
    return Array.isArray(responseData)
      ? responseData.map((item) => item?.message || item).join(", ")
      : responseData.message || JSON.stringify(responseData);
  }
  return "Something went wrong";
};

const Product = () => {
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const storeId = localStorage.getItem("itemId") || "7";
  const { loading, error, collectionProducts } = useSelector((state) => state.store);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetailTab, setProductDetailTab] = useState("variants");
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isSkuManuallyEdited, setIsSkuManuallyEdited] = useState(false);
  const [im, setIm] = useState({
    profile: null,
    cover: null,
  });
  const [variations, setVariations] = useState([]);
  const [variants, setVariants] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [lastGeneratedVariantSignature, setLastGeneratedVariantSignature] = useState("");
  const [currentVariation, setCurrentVariation] = useState(createEmptyVariation());
  const [currentOption, setCurrentOption] = useState(createEmptyOption());
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    description: "",
    price: "",
    stock: "",
    image_url: "",
    sort_order: "1",
  });
  const [showVariationSection, setShowVariationSection] = useState(false);
  const [editingVariationIndex, setEditingVariationIndex] = useState(null);

  const profileInputRef = useRef(null);
  const optionImageRef = useRef(null);
  const basePricingCacheRef = useRef({ price: "", stock: "" });
  const variationPricingCacheRef = useRef([]);
  const hasReadyCurrentVariation = React.useMemo(
    () => isVariationReadyForSubmit(currentVariation),
    [currentVariation]
  );
  const actionableVariations = React.useMemo(() => {
    const nextVariation = buildVariationDraft(currentVariation);

    if (!hasReadyCurrentVariation) {
      return variations;
    }

    if (editingVariationIndex === null) {
      return [...variations, nextVariation];
    }

    return variations.map((variation, index) =>
      index === editingVariationIndex ? nextVariation : variation
    );
  }, [currentVariation, editingVariationIndex, hasReadyCurrentVariation, variations]);
  const variationSignature = React.useMemo(
    () => buildVariationGenerationSignature(actionableVariations),
    [actionableVariations]
  );
  const formMode = React.useMemo(
    () => getProductFormMode(actionableVariations, variants),
    [actionableVariations, variants]
  );
  const variantsDirty =
    formMode === "variants" && variationSignature !== lastGeneratedVariantSignature;
  const canGenerateVariants = React.useMemo(
    () => countVariationsWithOptions(actionableVariations) > 1,
    [actionableVariations]
  );

  useEffect(() => {
    if (formMode === "simple") {
      basePricingCacheRef.current = {
        price: productForm.price ?? "",
        stock: productForm.stock ?? "",
      };
    }
  }, [formMode, productForm.price, productForm.stock]);

  useEffect(() => {
    if (formMode === "variations") {
      variationPricingCacheRef.current = snapshotVariationPricing(variations);
    }
  }, [formMode, variations]);

  useEffect(() => {
    if (token) {
      dispatch(
        getAllProductForCollection({
          token,
          id: storeId,
          page: currentPage,
          limit: PRODUCTS_PER_PAGE,
        })
      );
    }
  }, [currentPage, dispatch, storeId, token]);

  const storedProducts = readStoredProducts();

  const products =
    Array.isArray(collectionProducts?.data) && collectionProducts.data.length > 0
      ? collectionProducts.data
      : storedProducts;
  const productPagination = collectionProducts?.pagination || {};

  const productCategories = [];
  products.forEach((product) => {
    const category = resolveProductCategory(product);
    if (category && !productCategories.includes(category)) {
      productCategories.push(category);
    }
  });

  const availableCategories = [...new Set([...categories, ...productCategories])];
  const hasProducts = products.length > 0;
  const subtitle = hasProducts ? "Overview of your inventory" : "All products in your store";

  const filteredProducts = products.filter((product, index) => {
    const productName = resolveProductName(product).toLowerCase();
    const productSku = resolveProductSku(product).toLowerCase();
    const productCategory = resolveProductCategory(product).toLowerCase();
    const productId = resolveProductId(product, index).toString().toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      productName.includes(searchQuery.toLowerCase()) ||
      productSku.includes(searchQuery.toLowerCase()) ||
      productCategory.includes(searchQuery.toLowerCase()) ||
      productId.includes(searchQuery.toLowerCase());
    const productStatus = resolveProductStatus(product);
    const matchesStatus = statusFilter === "all" || productStatus === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || resolveProductCategory(product) === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalProducts = productPagination?.total_items || products.length;
  const lowStockItems = products.filter(
    (product) => resolveProductStatus(product) === "low-stock"
  ).length;
  const totalItemsInStock = products.reduce(
    (total, product) => total + Math.max(resolveProductStock(product), 0),
    0
  );
  const inventoryValue = products.reduce(
    (total, product) =>
      total + resolveProductPrice(product) * Math.max(resolveProductStock(product), 0),
    0
  );
  const selectedProductDetailVariations = React.useMemo(
    () => resolveDetailVariations(selectedProduct || {}),
    [selectedProduct]
  );
  const selectedProductVariantRows = React.useMemo(
    () =>
      buildDetailVariantRows(
        selectedProductDetailVariations,
        resolveProductPrice(selectedProduct || {}),
        resolveProductSku(selectedProduct || {})
      ),
    [selectedProduct, selectedProductDetailVariations]
  );
  const selectedProductPrices = selectedProductVariantRows.length
    ? selectedProductVariantRows.map((row) => row.price)
    : [resolveProductPrice(selectedProduct || {})];
  const selectedProductMinPrice = Math.min(...selectedProductPrices);
  const selectedProductMaxPrice = Math.max(...selectedProductPrices);
  const selectedProductTotalStock = selectedProductVariantRows.length
    ? selectedProductVariantRows.reduce((total, row) => total + Math.max(row.stock, 0), 0)
    : resolveProductStock(selectedProduct || {});
  const selectedProductActiveVariantCount = selectedProductVariantRows.filter(
    (row) => row.active
  ).length;
  const selectedProductLowStockCount = selectedProductVariantRows.filter(
    (row) => row.stock > 0 && row.stock < 5
  ).length;

  const summaryCards = [
    {
      label: "Total Products",
      value: totalProducts.toLocaleString("en-NG"),
      icon: faBagShopping,
      trend: "+8%",
      trendLabel: "this month",
      trendDirection: "up",
      iconClassName: styles.vendorProductSummaryIconBlue,
    },
    {
      label: "Low Stock Items",
      value: lowStockItems.toLocaleString("en-NG"),
      icon: faCircleExclamation,
      trend: "-2%",
      trendLabel: "this month",
      trendDirection: "down",
      iconClassName: styles.vendorProductSummaryIconRed,
    },
    {
      label: "Total Items in Stock",
      value: totalItemsInStock.toLocaleString("en-NG"),
      icon: faCartShopping,
      trend: "+2%",
      trendLabel: "this month",
      trendDirection: "up",
      iconClassName: styles.vendorProductSummaryIconPurple,
    },
    {
      label: "Inventory Value",
      value: formatCurrency(inventoryValue),
      icon: faWallet,
      trend: "+12%",
      trendLabel: "this month",
      trendDirection: "up",
      iconClassName: styles.vendorProductSummaryIconGreen,
    },
  ];

  const handleExport = () => {
    if (typeof window === "undefined" || filteredProducts.length === 0) {
      return;
    }

    const csvRows = [
      ["ID", "Product Name", "SKU", "Category", "Unit Price", "Status", "Stock"].join(","),
      ...filteredProducts.map((product, index) =>
        [
          `"${resolveProductId(product, index)}"`,
          `"${resolveProductName(product)}"`,
          `"${resolveProductSku(product)}"`,
          `"${resolveProductCategory(product)}"`,
          `"${formatCurrency(resolveProductPrice(product))}"`,
          `"${resolveProductStatus(product) === "in-stock" ? "In Stock" : "Low Stock"}"`,
          `"${resolveProductStock(product)}"`,
        ].join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const exportUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = exportUrl;
    link.download = "products.csv";
    link.click();
    window.URL.revokeObjectURL(exportUrl);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const triggerInput = (ref) => ref.current?.click();

  const resetCreateProductForm = () => {
    basePricingCacheRef.current = { price: "", stock: "" };
    variationPricingCacheRef.current = [];
    setProductForm({
      name: "",
      sku: "",
      description: "",
      price: "",
      stock: "",
      image_url: "",
      sort_order: "1",
    });
    setSelectedCategory("");
    setCategoryInput("");
    setShowCategoryDropdown(false);
    setIm({ profile: null, cover: null });
    setVariations([]);
    setVariants([]);
    setFormErrors({});
    setLastGeneratedVariantSignature("");
    setCurrentVariation(createEmptyVariation());
    setCurrentOption(createEmptyOption());
    setEditingVariationIndex(null);
    setShowVariationSection(false);
    setIsSkuManuallyEdited(false);
  };

  const openCreateProductModal = () => {
    resetCreateProductForm();
    setOpenActionMenuId(null);
    setIsEditMode(false);
    setEditingProductId(null);
    setIsSkuManuallyEdited(false);
    setIsCreateModalOpen(true);
  };

  const openProductDetails = (product) => {
    setOpenActionMenuId(null);
    setProductDetailTab("variants");
    setSelectedProduct(product);
  };

  const closeCreateProductModal = () => {
    setIsCreateModalOpen(false);
    setIsEditMode(false);
    setEditingProductId(null);
    resetCreateProductForm();
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
    setProductDetailTab("variants");
  };

  const toggleActionMenu = (productId) => {
    setOpenActionMenuId((previousMenuId) =>
      previousMenuId === productId ? null : productId
    );
  };

  const refreshProducts = async () => {
    await dispatch(
      getAllProductForCollection({
        token,
        id: storeId,
        page: currentPage,
        limit: PRODUCTS_PER_PAGE,
      })
    ).unwrap();
  };

  const applyProductToEditForm = (product = {}) => {
    setOpenActionMenuId(null);
    setSelectedProduct(null);
    setIsEditMode(true);
    setEditingProductId(product?.id || null);
    const formVariations = resolveFormVariations(
      product?.variations ??
        product?.product_variations ??
        product?.variation_groups ??
        product?.variant_groups ??
        []
    );
    const savedVariants = resolveFormVariants(product);
    const nextMode = getProductFormMode(formVariations, savedVariants);
    const clearedVariationPricing =
      nextMode === "variants" ? clearVariationPricing(formVariations) : formVariations;

    basePricingCacheRef.current = {
      price: product?.price ?? "",
      stock: product?.stock ?? "",
    };
    variationPricingCacheRef.current = snapshotVariationPricing(formVariations);

    setProductForm({
      name: product?.name || "",
      sku: product?.sku || "",
      description: product?.description || "",
      price: nextMode === "simple" ? product?.price || "" : "",
      stock: nextMode === "simple" ? product?.stock || "" : "",
      image_url: product?.image_url || product?.product_image || "",
      sort_order: String(product?.sort_order ?? 1),
    });
    const currentCategory = product?.category || product?.Category?.name || "";
    setSelectedCategory(currentCategory);
    setCategoryInput(currentCategory);
    setIm({
      profile: product?.image_url || product?.product_image || null,
      cover: null,
    });
    setVariations(formVariations.length > 0 ? clearedVariationPricing : []);
    setVariants(savedVariants);
    setLastGeneratedVariantSignature(
      savedVariants.length > 0 ? buildVariationGenerationSignature(clearedVariationPricing) : ""
    );
    setShowVariationSection(formVariations.length > 0);
    setFormErrors({});
    setCurrentVariation(createEmptyVariation());
    setCurrentOption(createEmptyOption());
    setEditingVariationIndex(null);
    setIsSkuManuallyEdited(true);
    setIsCreateModalOpen(true);
  };

  const openEditProductModal = async (product) => {
    const productId = product?.id;

    if (!productId || !token) {
      applyProductToEditForm(product);
      return;
    }

    try {
      Swal.fire({
        title: "Loading Product...",
        text: "Please wait while we fetch the product details.",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await dispatch(
        getProductDetails({ token, id: storeId, productId })
      ).unwrap();

      const detailedProduct = extractDetailedProduct(response, product);
      applyProductToEditForm(detailedProduct);
      Swal.close();
    } catch (submitError) {
      applyProductToEditForm(product);
      Swal.fire({
        icon: "info",
        title: "Loaded Basic Product Info",
        text:
          resolveApiErrorMessage(submitError) ||
          "We could not load the full product details, so some variation data may be missing.",
        confirmButtonColor: "#0273F9",
      });
    }
  };

  const handleDeleteProduct = async (product) => {
    const productId = product?.id;
    if (!productId) return;

    const result = await Swal.fire({
      title: "Delete Product?",
      html: `Are you sure you want to delete <span style="color: #DC2626; font-weight: bold;">"${resolveProductName(
        product
      )}"</span>? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: "Deleting Product...",
        text: "Please wait while we process your request.",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await dispatch(
        deleteProductFromStore({ token, id: storeId, productId })
      ).unwrap();

      await refreshProducts();
      setSelectedProduct(null);

      Swal.fire({
        icon: response?.success === true ? "success" : "info",
        title: response?.success === true ? "Product Deleted!" : "Product Deletion",
        text: response?.message || "Request completed.",
        confirmButtonColor: "#0273F9",
      });
    } catch (submitError) {
      Swal.fire({
        icon: "error",
        title: "Error Occurred",
        text: resolveApiErrorMessage(submitError),
        confirmButtonColor: "#0273F9",
      });
    }
  };

  const handlePublishStateChange = async (product, shouldPublish) => {
    const productId = product?.id;
    if (!productId) return;

    try {
      Swal.fire({
        title: shouldPublish ? "Publishing Product..." : "Unpublishing Product...",
        text: "Please wait while we process your request.",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = shouldPublish
        ? await dispatch(
            publishProductToStore({
              token,
              id: storeId,
              productId,
              value: "publish",
            })
          ).unwrap()
        : await dispatch(
            unpublishProductToStore({
              token,
              id: storeId,
              productId,
              value: true,
            })
          ).unwrap();

      await refreshProducts();

      Swal.fire({
        icon: response?.success === true ? "success" : "info",
        title: response?.success === true ? "Success" : "Action Failed",
        text:
          response?.message ||
          `Product has been ${shouldPublish ? "published" : "unpublished"}.`,
        confirmButtonColor: "#0273F9",
      });
    } catch (submitError) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: resolveApiErrorMessage(submitError),
        confirmButtonColor: "#0273F9",
      });
    }
  };

  const handleActionMenuSelection = async (action, product) => {
    setOpenActionMenuId(null);

    if (action === "update") {
      openEditProductModal(product);
      return;
    }

    if (action === "publish") {
      await handlePublishStateChange(product, true);
      return;
    }

    if (action === "unpublish") {
      await handlePublishStateChange(product, false);
      return;
    }

    if (action === "delete") {
      await handleDeleteProduct(product);
    }
  };

  const handleImageChange = (event, key) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setIm((previousImages) => ({
        ...previousImages,
        [key]: reader.result,
      }));
      clearFormErrorPaths("product_image", "image_url");
      setProductForm((previousForm) => ({
        ...previousForm,
        image_url: "",
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleProductNameChange = (event) => {
    const name = event.target.value;
    const newSKU = generateSKU(name);

    setProductForm((previousForm) => ({
      ...previousForm,
      name,
      sku: isEditMode || isSkuManuallyEdited ? previousForm.sku : newSKU,
    }));
    clearFormErrorPaths("name", "sku");
  };

  const handleProductFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === "sku") {
      setIsSkuManuallyEdited(true);
    }

    setProductForm((previousForm) => ({
      ...previousForm,
      [name]: type === "checkbox" ? checked : value,
    }));
    clearFormErrorPaths(name, name === "image_url" ? "product_image" : name);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCategoryInput(category);
    setShowCategoryDropdown(false);
    clearFormErrorPaths("category");
  };

  const handleCategoryInputChange = (event) => {
    const value = event.target.value;
    setCategoryInput(value);
    setSelectedCategory(value);
    clearFormErrorPaths("category");
  };

  const handleAddCategory = () => {
    const trimmedCategory = categoryInput.trim();
    if (trimmedCategory && !availableCategories.includes(trimmedCategory)) {
      setCategories((previousCategories) => [...previousCategories, trimmedCategory]);
      setSelectedCategory(trimmedCategory);
    }
  };

  const handleCategoryInputBlur = () => {
    if (categoryInput.trim()) {
      handleAddCategory();
      setCategoryInput(categoryInput.trim());
      setSelectedCategory(categoryInput.trim());
      clearFormErrorPaths("category");
    }
    window.setTimeout(() => setShowCategoryDropdown(false), 200);
  };

  const handleCategoryInputFocus = () => {
    setShowCategoryDropdown(true);
  };

  const filteredCategoryOptions = availableCategories.filter((category) =>
    category.toLowerCase().includes(categoryInput.toLowerCase())
  );

  const clearFormErrorPaths = (...paths) => {
    if (paths.length === 0) return;

    setFormErrors((previousErrors) => {
      const nextErrors = { ...previousErrors };
      let hasChanges = false;

      Object.keys(nextErrors).forEach((key) => {
        if (
          paths.some(
            (path) => key === path || key.startsWith(`${path}.`) || key.startsWith(`${path}[`)
          )
        ) {
          delete nextErrors[key];
          hasChanges = true;
        }
      });

      return hasChanges ? nextErrors : previousErrors;
    });
  };

  const enterVariationPricingMode = () => {
    if (variations.length > 0) {
      return true;
    }

    const hasBasePricingValues =
      String(productForm.price ?? "").trim() !== "" || String(productForm.stock ?? "").trim() !== "";

    if (
      hasBasePricingValues &&
      !window.confirm(
        "Adding variations will clear the base product price and stock so pricing can be managed per variation option. Continue?"
      )
    ) {
      return false;
    }

    basePricingCacheRef.current = {
      price: productForm.price ?? "",
      stock: productForm.stock ?? "",
    };

    setProductForm((previousForm) => ({
      ...previousForm,
      price: "",
      stock: "",
    }));

    return true;
  };

  const restoreBasePricingMode = () => {
    setProductForm((previousForm) => ({
      ...previousForm,
      price: basePricingCacheRef.current?.price ?? "",
      stock: basePricingCacheRef.current?.stock ?? "",
    }));
  };

  const clearVariantsToVariationMode = (
    confirmationMessage = "Removing this will clear all generated variants and reset pricing to variation options. Continue?"
  ) => {
    if (variants.length > 0 && !window.confirm(confirmationMessage)) {
      return false;
    }

    setVariants([]);
    setLastGeneratedVariantSignature("");
    setVariations((previousVariations) =>
      restoreVariationPricing(previousVariations, variationPricingCacheRef.current)
    );
    clearFormErrorPaths("variants");

    return true;
  };

  const handleAddVariationBlock = () => {
    if (!enterVariationPricingMode()) {
      return;
    }

    setVariations((previousVariations) => [...previousVariations, createEmptyVariation()]);
    setShowVariationSection(true);
    clearFormErrorPaths("variations", "variants");
  };

  const handleVariationFieldChange = (variationIndex, field, value) => {
    setVariations((previousVariations) =>
      previousVariations.map((variation, index) => {
        if (index !== variationIndex) {
          return variation;
        }

        if (field === "variation_type") {
          const normalizedType = normalizeVariationType(value);
          const previousLabel = getVariationTypeLabel(variation?.variation_type || "");
          const nextLabel = getVariationTypeLabel(normalizedType);

          return {
            ...variation,
            variation_type: normalizedType,
            variation_name:
              !String(variation?.variation_name || "").trim() ||
              String(variation?.variation_name || "").trim() === previousLabel
                ? nextLabel
                : variation.variation_name,
          };
        }

        return {
          ...variation,
          [field]: value,
        };
      })
    );
    clearFormErrorPaths(`variations.${variationIndex}.${field}`, `variations.${variationIndex}`);
  };

  const handleAddOptionRow = (variationIndex) => {
    setVariations((previousVariations) =>
      previousVariations.map((variation, index) =>
        index === variationIndex
          ? {
              ...variation,
              options: [...(Array.isArray(variation?.options) ? variation.options : []), createEmptyOption()],
            }
          : variation
      )
    );
    clearFormErrorPaths(`variations.${variationIndex}.options`, "variants");
  };

  const handleQuickAddOption = (variationIndex, optionValue) => {
    setVariations((previousVariations) =>
      previousVariations.map((variation, index) => {
        if (index !== variationIndex) {
          return variation;
        }

        const alreadyExists = (Array.isArray(variation?.options) ? variation.options : []).some(
          (option) => String(option?.value || "").trim().toLowerCase() === optionValue.toLowerCase()
        );

        if (alreadyExists) {
          return variation;
        }

        return {
          ...variation,
          options: [
            ...(Array.isArray(variation?.options) ? variation.options : []),
            {
              ...createEmptyOption(),
              value: optionValue,
              display_name: optionValue,
            },
          ],
        };
      })
    );
    clearFormErrorPaths(`variations.${variationIndex}.options`, "variants");
  };

  const handleOptionFieldChange = (variationIndex, optionIndex, field, value) => {
    setVariations((previousVariations) =>
      previousVariations.map((variation, index) => {
        if (index !== variationIndex) {
          return variation;
        }

        return {
          ...variation,
          options: (Array.isArray(variation?.options) ? variation.options : []).map((option, currentOptionIndex) => {
            if (currentOptionIndex !== optionIndex) {
              return option;
            }

            if (field === "value") {
              return {
                ...option,
                value,
                display_name:
                  !String(option?.display_name || "").trim() ||
                  String(option?.display_name || "").trim() === String(option?.value || "").trim()
                    ? value
                    : option.display_name,
              };
            }

            return {
              ...option,
              [field]: field === "sku" ? value || null : value,
            };
          }),
        };
      })
    );
    clearFormErrorPaths(
      `variations.${variationIndex}.options.${optionIndex}.${field}`,
      `variations.${variationIndex}.options.${optionIndex}.value`,
      "variants"
    );
  };

  const handleOptionDefaultToggle = (variationIndex, optionIndex, checked) => {
    setVariations((previousVariations) =>
      previousVariations.map((variation, index) => {
        if (index !== variationIndex) {
          return variation;
        }

        return {
          ...variation,
          options: (Array.isArray(variation?.options) ? variation.options : []).map((option, currentOptionIndex) => ({
            ...option,
            is_default: checked ? currentOptionIndex === optionIndex : false,
          })),
        };
      })
    );
  };

  const handleOptionImageUpload = (variationIndex, optionIndex, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setVariations((previousVariations) =>
        previousVariations.map((variation, index) => {
          if (index !== variationIndex) {
            return variation;
          }

          return {
            ...variation,
            options: (Array.isArray(variation?.options) ? variation.options : []).map((option, currentOptionIndex) =>
              currentOptionIndex === optionIndex
                ? {
                    ...option,
                    image_url: reader.result,
                    imageFile: file,
                  }
                : option
            ),
          };
        })
      );
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveOptionRow = (variationIndex, optionIndex) => {
    setVariations((previousVariations) =>
      previousVariations.map((variation, index) =>
        index === variationIndex
          ? {
              ...variation,
              options: (Array.isArray(variation?.options) ? variation.options : []).filter(
                (_, currentOptionIndex) => currentOptionIndex !== optionIndex
              ),
            }
          : variation
      )
    );
    clearFormErrorPaths(`variations.${variationIndex}.options.${optionIndex}`, "variants");
  };

  const handleRemoveVariationBlock = (variationIndex) => {
    const nextVariations = variations.filter((_, index) => index !== variationIndex);
    const removingAllVariations = nextVariations.length === 0;

    if (removingAllVariations) {
      if (
        !window.confirm(
          "Removing all variations will also clear all variants and reset pricing to the base product. Continue?"
        )
      ) {
        return;
      }

      setVariations([]);
      setVariants([]);
      setLastGeneratedVariantSignature("");
      setShowVariationSection(false);
      restoreBasePricingMode();
      clearFormErrorPaths("variations", "variants", "price", "stock");
      return;
    }

    if (
      variants.length > 0 &&
      !window.confirm(
        "Removing this will clear all generated variants and reset pricing to variation options. Continue?"
      )
    ) {
      return;
    }

    const restoredVariations =
      variants.length > 0
        ? restoreVariationPricing(nextVariations, variationPricingCacheRef.current)
        : nextVariations;

    setVariations(restoredVariations);
    if (variants.length > 0) {
      setVariants([]);
      setLastGeneratedVariantSignature("");
    }
    clearFormErrorPaths(`variations.${variationIndex}`, "variants");
  };

  const handleGenerateVariants = () => {
    const sanitizedVariations = resolveFormVariations(actionableVariations);
    const variationsWithValues = sanitizedVariations.filter((variation) =>
      variation.options.some((option) => String(option?.value || "").trim())
    );

    if (variationsWithValues.length < 2) {
      setFormErrors((previousErrors) => ({
        ...previousErrors,
        variants: "Add at least two variation types with option values to generate variants.",
      }));
      return;
    }

    if (
      variants.length > 0 &&
      variantsDirty &&
      !window.confirm("This will replace existing variant data. Continue?")
    ) {
      return;
    }

    variationPricingCacheRef.current = snapshotVariationPricing(actionableVariations);

    const nextVariants = generateVariantsFromVariations(
      actionableVariations,
      productForm.sku,
      productForm.price,
      variants,
      true
    );
    const nextClearedVariations = clearVariationPricing(actionableVariations);

    setProductForm((previousForm) => ({
      ...previousForm,
      price: 0,
      stock: 0,
    }));
    setVariations(nextClearedVariations);
    if (hasReadyCurrentVariation) {
      setCurrentVariation(createEmptyVariation());
      setCurrentOption(createEmptyOption());
      setEditingVariationIndex(null);
    }
    setVariants(nextVariants);
    setLastGeneratedVariantSignature(buildVariationGenerationSignature(nextClearedVariations));
    clearFormErrorPaths("variants", "price", "stock");
  };

  const handleClearVariants = () => {
    clearVariantsToVariationMode();
  };

  const handleVariantFieldChange = (variantIndex, field, value) => {
    setVariants((previousVariants) =>
      previousVariants.map((variant, index) =>
        index === variantIndex
          ? {
              ...variant,
              [field]: field === "enabled" ? value : value,
            }
          : variant
      )
    );
    clearFormErrorPaths(`variants.${variantIndex}.${field}`, "variants");
  };

  const handleVariantImageUpload = (variantIndex, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setVariants((previousVariants) =>
        previousVariants.map((variant, index) =>
          index === variantIndex
            ? {
                ...variant,
                image_url: reader.result,
                imageFile: file,
              }
            : variant
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleVariationNameChange = (event) => {
    setCurrentVariation((previousVariation) => ({
      ...previousVariation,
      variation_name: event.target.value,
    }));
  };

  const handleVariationTypeChange = (event) => {
    const variationType = normalizeVariationType(event.target.value);
    setCurrentVariation((previousVariation) => ({
      ...previousVariation,
      variation_type: variationType,
      variation_name:
        previousVariation.variation_name ||
        (variationType === "custom" ? "" : getVariationTypeLabel(variationType)),
    }));
  };

  const handleVariationRequiredChange = (event) => {
    setCurrentVariation((previousVariation) => ({
      ...previousVariation,
      is_required: event.target.checked,
    }));
  };

  const handleOptionValueChange = (event) => {
    const nextValue = event.target.value;
    setCurrentOption((previousOption) => ({
      ...previousOption,
      value: nextValue,
      display_name:
        !previousOption.display_name || previousOption.display_name === previousOption.value
          ? nextValue
          : previousOption.display_name,
    }));
  };

  const handleOptionDisplayNameChange = (event) => {
    setCurrentOption((previousOption) => ({
      ...previousOption,
      display_name: event.target.value,
    }));
  };

  const handleOptionPriceChange = (event) => {
    setCurrentOption((previousOption) => ({
      ...previousOption,
      price: parseFloat(event.target.value) || "",
    }));
  };

  const handleOptionStockChange = (event) => {
    setCurrentOption((previousOption) => ({
      ...previousOption,
      stock: parseInt(event.target.value, 10) || "",
    }));
  };

  const handleOptionSkuChange = (event) => {
    setCurrentOption((previousOption) => ({
      ...previousOption,
      sku: event.target.value || null,
    }));
  };

  const handleOptionDefaultChange = (event) => {
    setCurrentOption((previousOption) => ({
      ...previousOption,
      is_default: event.target.checked,
    }));
  };

  const handleOptionImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCurrentOption((previousOption) => ({
        ...previousOption,
        image_url: reader.result,
        imageFile: file,
      }));
    };
    reader.readAsDataURL(file);
  };

  const addOption = () => {
    const requiresOptionPricing = formMode !== "variants";

    if (
      currentOption.value &&
      (!requiresOptionPricing || (currentOption.price !== "" && currentOption.stock !== ""))
    ) {
      const nextOption = {
        value: currentOption.value,
        display_name: currentOption.display_name || currentOption.value,
        price: requiresOptionPricing ? currentOption.price : "",
        stock: requiresOptionPricing ? currentOption.stock : "",
        sku: currentOption.sku ?? null,
        image_url: currentOption.image_url || "",
        is_default: currentOption.is_default === true,
        imageFile: currentOption.imageFile instanceof File ? currentOption.imageFile : null,
      };

      setCurrentVariation((previousVariation) => ({
        ...previousVariation,
        options: [
          ...((Array.isArray(previousVariation.options) ? previousVariation.options : []).map((option) => ({
            ...option,
            is_default: nextOption.is_default ? false : option.is_default === true,
          }))),
          nextOption,
        ],
      }));
      setCurrentOption(createEmptyOption());
    } else {
      window.alert(
        requiresOptionPricing
          ? "Please fill in all required fields: Option Value, Price, and Stock"
          : "Please fill in the option value before saving."
      );
    }
  };

  const removeOption = (index) => {
    setCurrentVariation((previousVariation) => ({
      ...previousVariation,
      options: previousVariation.options.filter((_, optionIndex) => optionIndex !== index),
    }));
  };

  const addVariation = () => {
    const nextVariation = buildVariationDraft(currentVariation);

    if (
      !nextVariation.variation_name ||
      !nextVariation.variation_type ||
      nextVariation.options.length === 0
    ) {
      Swal.fire({
        icon: "info",
        title: "Variation",
        text: "Add a variation type, variation name, and at least one option value first.",
        confirmButtonColor: "#0273F9",
      });
      return;
    }

    setVariations((previousVariations) => {
      if (editingVariationIndex === null) {
        return [...previousVariations, nextVariation];
      }

      return previousVariations.map((variation, index) =>
        index === editingVariationIndex ? nextVariation : variation
      );
    });
    setCurrentVariation(createEmptyVariation());
    setCurrentOption(createEmptyOption());
    setEditingVariationIndex(null);
  };

  const removeVariation = (index) => {
    const nextVariations = variations.filter((_, variationIndex) => variationIndex !== index);
    const removingAllVariations = nextVariations.length === 0;

    if (removingAllVariations) {
      if (
        !window.confirm(
          "Removing all variations will also clear all variants and reset pricing to the base product. Continue?"
        )
      ) {
        return;
      }

      setVariations([]);
      setVariants([]);
      setLastGeneratedVariantSignature("");
      setShowVariationSection(false);
      restoreBasePricingMode();
      clearFormErrorPaths("variations", "variants", "price", "stock");
    } else if (variants.length > 0) {
      if (
        !window.confirm(
          "Removing this will clear all generated variants and reset pricing to variation options. Continue?"
        )
      ) {
        return;
      }

      setVariations(restoreVariationPricing(nextVariations, variationPricingCacheRef.current));
      setVariants([]);
      setLastGeneratedVariantSignature("");
      clearFormErrorPaths("variants");
    } else {
      setVariations(nextVariations);
    }

    if (editingVariationIndex === index) {
      setCurrentVariation(createEmptyVariation());
      setCurrentOption(createEmptyOption());
      setEditingVariationIndex(null);
    } else if (editingVariationIndex !== null && editingVariationIndex > index) {
      setEditingVariationIndex((previousIndex) => previousIndex - 1);
    }
  };

  const editVariation = (index) => {
    const variationToEdit = normalizeFormVariation(variations[index]);
    setCurrentVariation(buildVariationDraft(variationToEdit));
    setCurrentOption(createEmptyOption());
    setEditingVariationIndex(index);
    setShowVariationSection(true);
  };

  const startNewVariation = () => {
    if (!enterVariationPricingMode()) {
      return;
    }

    setEditingVariationIndex(null);
    setCurrentVariation(createEmptyVariation());
    setCurrentOption(createEmptyOption());
    setShowVariationSection(true);
  };

  const toggleVariationSection = () => {
    if (!showVariationSection) {
      startNewVariation();
      return;
    }

    if (variations.length === 0) {
      restoreBasePricingMode();
    }

    setCurrentVariation(createEmptyVariation());
    setCurrentOption(createEmptyOption());
    setEditingVariationIndex(null);
    setShowVariationSection(false);
  };

  const base64ToFile = (base64String, filename) => {
    const arr = base64String.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    const trimmedCategory = selectedCategory.trim() || categoryInput.trim();
    const submitVariations = resolveFormVariations(actionableVariations);
    const submitMode = getProductFormMode(submitVariations, variants);
    const hasVariationsForSubmit = submitVariations.length > 0;
    const hasVariantsForSubmit = Array.isArray(variants) && variants.length > 0;
    const nextErrors = {};

    if (!productForm.name.trim()) {
      nextErrors.name = "Product name is required.";
    }

    if (!productForm.sku.trim()) {
      nextErrors.sku = "Base SKU is required.";
    }

    if (!productForm.description.trim()) {
      nextErrors.description = "Description is required.";
    }

    if (!trimmedCategory) {
      nextErrors.category = "Select or enter a category.";
    }

    if (submitMode === "simple") {
      if (productForm.price === "" || Number(productForm.price) <= 0) {
        nextErrors.price = "Price must be greater than 0.";
      }

      if (productForm.stock === "" || Number(productForm.stock) < 0) {
        nextErrors.stock = "Stock must be 0 or greater.";
      }
    } else {
      submitVariations.forEach((variation, variationIndex) => {
        if (!String(variation?.variation_name || "").trim()) {
          nextErrors[`variations.${variationIndex}.variation_name`] =
            "Variation name is required.";
        }

        if (!String(variation?.variation_type || "").trim()) {
          nextErrors[`variations.${variationIndex}.variation_type`] =
            "Variation type is required.";
        }

        if (!Array.isArray(variation?.options) || variation.options.length === 0) {
          nextErrors[`variations.${variationIndex}.options`] =
            "Add at least one option to this variation.";
        }

        variation.options.forEach((option, optionIndex) => {
          if (!String(option?.value || "").trim()) {
            nextErrors[`variations.${variationIndex}.options.${optionIndex}.value`] =
              "Option value is required.";
          }

          if (submitMode === "variations") {
            if (option?.price === "" || option?.price === null || option?.price === undefined) {
              nextErrors[`variations.${variationIndex}.options.${optionIndex}.price`] =
                "Price is required.";
            } else if (Number(option.price) <= 0) {
              nextErrors[`variations.${variationIndex}.options.${optionIndex}.price`] =
                "Price must be greater than 0.";
            }

            if (option?.stock === "" || option?.stock === null || option?.stock === undefined) {
              nextErrors[`variations.${variationIndex}.options.${optionIndex}.stock`] =
                "Stock is required.";
            } else if (Number(option.stock) < 0) {
              nextErrors[`variations.${variationIndex}.options.${optionIndex}.stock`] =
                "Stock must be 0 or greater.";
            }
          }
        });
      });

      if (hasVariantsForSubmit && hasVariationsForSubmit && variantsDirty) {
        nextErrors.variants =
          "Your variations have changed. Regenerate variants to update the table.";
      } else if (hasVariantsForSubmit) {
        variants.forEach((variant, variantIndex) => {
          if (variant?.enabled === false) {
            return;
          }

          if (!String(variant?.sku || "").trim()) {
            nextErrors[`variants.${variantIndex}.sku`] =
              "SKU is required for enabled variants.";
          }

          if (variant?.price === "" || variant?.price === null || variant?.price === undefined) {
            nextErrors[`variants.${variantIndex}.price`] = "Price is required.";
          } else if (Number(variant.price) <= 0) {
            nextErrors[`variants.${variantIndex}.price`] = "Price must be greater than 0.";
          }

          if (variant?.stock === "" || variant?.stock === null || variant?.stock === undefined) {
            nextErrors[`variants.${variantIndex}.stock`] = "Stock is required.";
          } else if (Number(variant.stock) < 0) {
            nextErrors[`variants.${variantIndex}.stock`] = "Stock must be 0 or greater.";
          }
        });
      }
    }

    if (!im.profile && !productForm.image_url.trim()) {
      nextErrors.product_image = "Upload a product image or provide an image URL.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});

    const variationsForFormData = submitVariations;
    const shouldUseBasePricing = !hasVariationsForSubmit && !hasVariantsForSubmit;
    const formData = new FormData();
    formData.append("name", productForm.name);
    formData.append("sku", productForm.sku);
    formData.append("description", productForm.description);
    formData.append("price", shouldUseBasePricing ? String(productForm.price ?? "") : "");
    formData.append("stock", shouldUseBasePricing ? String(productForm.stock ?? "") : "");
    formData.append("category", trimmedCategory);
    formData.append("sort_order", String(productForm.sort_order || 1));

    if (im.profile && im.profile.startsWith("data:")) {
      const imageFile = base64ToFile(im.profile, `product-${productForm.sku}.jpg`);
      formData.append("product_image", imageFile);
    }

    const resolvedImageUrl =
      productForm.image_url.trim() ||
      (im.profile && !im.profile.startsWith("data:") ? im.profile : "");

    if (resolvedImageUrl) {
      formData.append("image_url", resolvedImageUrl);
    }

    if (variationsForFormData.length > 0) {
      const variationsPayload = buildVariationsPayload(variationsForFormData);

      formData.append("variations", JSON.stringify(variationsPayload));

      variationsForFormData.forEach((variation, variationIndex) => {
        (Array.isArray(variation?.options) ? variation.options : []).forEach((option, optionIndex) => {
          if (option?.imageFile instanceof File) {
            formData.append(
              `variation_option_image_${variationIndex}_${optionIndex}`,
              option.imageFile
            );
          }
        });
      });
    }

    if (variants.length > 0) {
      const variantsPayload = buildVariantsPayload(variants)
        .filter((variant) => variant.enabled !== false)
        .map(({ enabled, ...variant }) => variant);

      formData.append("variants", JSON.stringify(variantsPayload));

      variants.forEach((variant, variantIndex) => {
        if (variant?.imageFile instanceof File) {
          formData.append(`variant_image_${variantIndex}`, variant.imageFile);
        }
      });
    }

    logProductSubmissionPayload(
      isEditMode ? "Update product submission" : "Create product submission",
      formData
    );

    try {
      Swal.fire({
        title: isEditMode ? "Updating Product..." : "Creating Product...",
        text: "Please wait while we process your request.",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = isEditMode
        ? await dispatch(
            updateProduct({
              formData,
              token,
              id: storeId,
              productId: editingProductId,
            })
          ).unwrap()
        : await dispatch(createProduct({ formData, token, id: storeId })).unwrap();

      await refreshProducts();

      closeCreateProductModal();

      Swal.fire({
        icon: "success",
        title: isEditMode ? "Product Updated!" : "Product Created!",
        text:
          response?.message ||
          (isEditMode
            ? "The product was updated successfully."
            : "The product was added successfully."),
        confirmButtonColor: "#0273F9",
      });
    } catch (submitError) {
      Swal.fire({
        icon: "error",
        title: "Error Occurred",
        text: resolveApiErrorMessage(submitError),
        confirmButtonColor: "#0273F9",
      });
    }
  };

  return (
    <div className={styles.vendorProductPage}>
      <header className={styles.vendorProductHeader}>
        <div className={styles.vendorProductHeaderCopy}>
          <h2 className={styles.vendorProductTitle}>Available Products</h2>
          <p className={styles.vendorProductSubtitle}>{subtitle}</p>
        </div>

        <Button
          type="button"
          variant="blueButton"
          size="lg"
          className={styles.vendorProductHeaderButton}
          onClick={openCreateProductModal}
        >
          Add New Product
        </Button>
      </header>

      {hasProducts && (
        <section className={styles.vendorProductSummaryGrid}>
          {summaryCards.map((card) => {
            const isPositive = card.trendDirection === "up";

            return (
              <article key={card.label} className={styles.vendorProductSummaryCard}>
                <div className={styles.vendorProductSummaryCardTop}>
                  <div>
                    <p className={styles.vendorProductSummaryLabel}>{card.label}</p>
                    <h3 className={styles.vendorProductSummaryValue}>{card.value}</h3>
                  </div>

                  <span
                    className={`${styles.vendorProductSummaryIconWrap} ${card.iconClassName}`}
                    aria-hidden="true"
                  >
                    <FontAwesomeIcon icon={card.icon} />
                  </span>
                </div>

                <p
                  className={`${styles.vendorProductSummaryTrend} ${
                    isPositive
                      ? styles.vendorProductSummaryTrendPositive
                      : styles.vendorProductSummaryTrendNegative
                  }`}
                >
                  <FontAwesomeIcon icon={isPositive ? faArrowTrendUp : faArrowTrendDown} />
                  <span>{card.trend}</span>
                  <span className={styles.vendorProductSummaryTrendMuted}>
                    {card.trendLabel}
                  </span>
                </p>
              </article>
            );
          })}
        </section>
      )}

      <section className={styles.vendorProductSection}>
        <div className={styles.vendorProductSectionHeader}>
          <h3 className={styles.vendorProductSectionTitle}>Product List</h3>
        </div>

        <div className={styles.vendorProductDivider} />

        {hasProducts ? (
          <div className={styles.vendorProductTableSection}>
            <div className={styles.vendorProductToolbar}>
              <div className={styles.vendorProductSearchWrap}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className={styles.vendorProductSearchInput}
                  placeholder="Search for product"
                />
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className={styles.vendorProductSearchIcon}
                />
              </div>

              <div className={styles.vendorProductToolbarActions}>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className={styles.vendorProductSelect}
                >
                  <option value="all">All Statuses</option>
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className={styles.vendorProductSelect}
                >
                  <option value="all">Category</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <Button
                  type="button"
                  variant="secondaryBorder"
                  size="sm"
                  className={styles.vendorProductExportButton}
                  onClick={handleExport}
                >
                  Export
                </Button>
              </div>
            </div>

            <div className={styles.vendorProductTableWrap}>
              <table className={styles.vendorProductTable}>
                <thead>
                  <tr>
                    <th>#ID</th>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Unit Price</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product, index) => {
                      const productName = resolveProductName(product);
                      const productStatus = resolveProductStatus(product);
                      const productImage = resolveProductImage(product);

                      return (
                        <tr
                          key={resolveProductId(product, index)}
                          onClick={() => openProductDetails(product)}
                          style={{ cursor: "pointer" }}
                        >
                          <td className={styles.vendorProductIdCell}>
                            {String(resolveProductId(product, index)).padStart(3, "0")}
                          </td>
                          <td>
                            <div className={styles.vendorProductNameCell}>
                              <span className={styles.vendorProductThumb} aria-hidden="true">
                                {productImage ? (
                                  <img src={productImage} alt={productName} />
                                ) : (
                                  <span className={styles.vendorProductThumbFallback} />
                                )}
                              </span>
                              <span
                                className={styles.vendorProductNameText}
                                style={{ color: "#0273F9" }}
                              >
                                {productName}
                              </span>
                            </div>
                          </td>
                          <td>{resolveProductSku(product)}</td>
                          <td>
                            <span className={styles.vendorProductCategoryPill}>
                              {resolveProductCategory(product)}
                            </span>
                          </td>
                          <td>{formatCurrency(resolveProductPrice(product))}</td>
                          <td>
                            <span
                              className={`${styles.vendorProductStatusPill} ${
                                productStatus === "in-stock"
                                  ? styles.vendorProductStatusPillSuccess
                                  : styles.vendorProductStatusPillWarning
                              }`}
                            >
                              {productStatus === "in-stock" ? "In Stock" : "Low Stock"}
                            </span>
                          </td>
                          <td style={{ position: "relative" }}>
                            <button
                              type="button"
                              className={styles.vendorProductMenuButton}
                              aria-label={`Manage ${productName}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleActionMenu(product.id || resolveProductId(product, index));
                              }}
                            >
                              <FontAwesomeIcon icon={faEllipsisVertical} />
                            </button>

                            {openActionMenuId ===
                              (product.id || resolveProductId(product, index)) && (
                              <div
                                onClick={(event) => event.stopPropagation()}
                                style={{
                                  position: "absolute",
                                  right: "24px",
                                  marginTop: "8px",
                                  minWidth: "210px",
                                  background: "#fff",
                                  border: "1px solid #E7E5E4",
                                  borderRadius: "12px",
                                  boxShadow: "0 12px 30px rgba(0, 0, 0, 0.12)",
                                  padding: "8px",
                                  zIndex: 20,
                                }}
                              >
                                {[
                                  {
                                    key: "update",
                                    label: "Update Product",
                                    icon: faPen,
                                    color: "#141B34",
                                  },
                                  {
                                    key: "publish",
                                    label: "Publish Product",
                                    icon: faUpload,
                                    color: "#0273F9",
                                  },
                                  {
                                    key: "unpublish",
                                    label: "Unpublish Product",
                                    icon: faEyeSlash,
                                    color: "#B45309",
                                  },
                                  {
                                    key: "delete",
                                    label: "Delete Product",
                                    icon: faTrashCan,
                                    color: "#DC2626",
                                  },
                                ].map((menuItem) => (
                                  <button
                                    key={menuItem.key}
                                    type="button"
                                    onClick={() =>
                                      handleActionMenuSelection(menuItem.key, product)
                                    }
                                    style={{
                                      width: "100%",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                      border: "none",
                                      background: "transparent",
                                      borderRadius: "10px",
                                      padding: "10px 12px",
                                      color: menuItem.color,
                                      fontSize: "14px",
                                      fontWeight: "500",
                                      textAlign: "left",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <FontAwesomeIcon
                                      icon={menuItem.icon}
                                      style={{ width: "14px" }}
                                    />
                                    <span>{menuItem.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className={styles.vendorProductTableEmpty}>
                        No products match your current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={productPagination?.total_pages || 1}
              onPageChange={handlePageChange}
              itemsPerPage={productPagination?.limit || PRODUCTS_PER_PAGE}
              totalItems={productPagination?.total_items || products.length}
              disabled={loading}
            />
          </div>
        ) : loading ? (
          <div className={styles.vendorProductStateWrap}>
            <p className={styles.vendorProductStateText}>Loading products...</p>
          </div>
        ) : (
          <div className={styles.vendorProductEmptyState}>
            <div className={styles.vendorProductEmptyIcon} aria-hidden="true">
              <FontAwesomeIcon icon={faBoxOpen} />
              <span className={styles.vendorProductEmptyIconBadge}>
                <FontAwesomeIcon icon={faPlus} />
              </span>
            </div>

            <h4 className={styles.vendorProductEmptyTitle}>No product found</h4>
            <p className={styles.vendorProductEmptyText}>
              Start selling by adding products to your online store
            </p>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={styles.vendorProductEmptyButton}
              onClick={openCreateProductModal}
            >
              Add Product
            </Button>
          </div>
        )}

        {!hasProducts && error && !loading && (
          <div className={styles.vendorProductStateWrap}>
            <p className={styles.vendorProductStateText}>{resolveErrorMessage(error)}</p>
          </div>
        )}
      </section>

      {selectedProduct && (
        <div
          className={styles["modal-overlay"]}
          onClick={closeProductDetails}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className={styles["modal-content2"]}
            style={{
              background: "#fff",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "1080px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="d-flex justify-content-between align-items-center p-3"
              style={{ borderBottom: "1px solid #eee" }}
            >
              <div>
                <h6 className="mb-1">Product Details</h6>
                <small style={{ color: "#78716C" }}>
                  {resolveProductName(selectedProduct)}
                </small>
              </div>
              <FontAwesomeIcon
                icon={faTimes}
                onClick={closeProductDetails}
                style={{ cursor: "pointer" }}
              />
            </div>

            <div className={styles.vendorProductDetailBody}>
              <section className={styles.vendorProductDetailHeaderCard}>
                <div className={styles.vendorProductDetailThumb}>
                  {resolveProductImage(selectedProduct) ? (
                    <img
                      src={resolveProductImage(selectedProduct)}
                      alt={resolveProductName(selectedProduct)}
                    />
                  ) : (
                    <FontAwesomeIcon icon={faBoxOpen} />
                  )}
                </div>

                <div className={styles.vendorProductDetailHeaderInfo}>
                  <h4>{resolveProductName(selectedProduct)}</h4>
                  <div className={styles.vendorProductDetailBadges}>
                    <span
                      className={`${styles.vendorProductStatusPill} ${
                        resolveProductStatus(selectedProduct) === "in-stock"
                          ? styles.vendorProductStatusPillSuccess
                          : styles.vendorProductStatusPillWarning
                      }`}
                    >
                      {resolveProductStatus(selectedProduct) === "in-stock" ? "Active" : "Low Stock"}
                    </span>
                    <span>{resolveProductCategory(selectedProduct)}</span>
                    <span>
                      {selectedProductDetailVariations.length} Variation
                      {selectedProductDetailVariations.length === 1 ? "" : "s"} ·{" "}
                      {selectedProductVariantRows.length || 1} Variant
                      {(selectedProductVariantRows.length || 1) === 1 ? "" : "s"}
                    </span>
                    <span>SKU: {resolveProductSku(selectedProduct)}</span>
                  </div>
                </div>

                <div className={styles.vendorProductDetailActions}>
                  <Button
                    type="button"
                    variant="secondaryBorder"
                    size="sm"
                    onClick={() => openEditProductModal(selectedProduct)}
                  >
                    Edit Product
                  </Button>
                </div>
              </section>

              <section className={styles.vendorProductDetailStatsGrid}>
                <article className={`${styles.vendorProductDetailStat} ${styles.vendorProductDetailStatAccent}`}>
                  <span>Price Range</span>
                  <strong>
                    {selectedProductMinPrice === selectedProductMaxPrice
                      ? formatCurrency(selectedProductMinPrice)
                      : `${formatCurrency(selectedProductMinPrice)} - ${formatCurrency(selectedProductMaxPrice)}`}
                  </strong>
                  <small>Across variants</small>
                </article>
                <article className={styles.vendorProductDetailStat}>
                  <span>Total Stock</span>
                  <strong>{selectedProductTotalStock.toLocaleString("en-NG")}</strong>
                  <small>Units available</small>
                </article>
                <article className={styles.vendorProductDetailStat}>
                  <span>Active Variants</span>
                  <strong>
                    {selectedProductVariantRows.length
                      ? selectedProductActiveVariantCount
                      : resolveProductStatus(selectedProduct) === "in-stock"
                        ? 1
                        : 0}
                  </strong>
                  <small>Visible on store</small>
                </article>
                <article className={styles.vendorProductDetailStat}>
                  <span>Low Stock</span>
                  <strong>{selectedProductLowStockCount}</strong>
                  <small>Below 5 units</small>
                </article>
              </section>

              <div className={styles.vendorProductDetailTabs}>
                {[
                  { key: "variants", label: "Variants" },
                  { key: "overview", label: "Overview" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`${styles.vendorProductDetailTab} ${
                      productDetailTab === tab.key ? styles.vendorProductDetailTabActive : ""
                    }`}
                    onClick={() => setProductDetailTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {productDetailTab === "variants" ? (
                <>
                  <div className={styles.vendorProductDetailVariantSummary}>
                    {selectedProductDetailVariations.length ? (
                      selectedProductDetailVariations.map((variation) => (
                        <article key={`${variation.name}-${variation.type}`}>
                          <span>
                            {variation.name} ({variation.options.length} options)
                          </span>
                          <div>
                            {variation.options.map((option) => (
                              <small key={`${variation.name}-${option.value}`}>
                                {option.value}
                              </small>
                            ))}
                          </div>
                        </article>
                      ))
                    ) : (
                      <article>
                        <span>No variations configured</span>
                        <div>
                          <small>Base product only</small>
                        </div>
                      </article>
                    )}
                  </div>

                  <div className={styles.vendorProductDetailTableWrap}>
                    <table className={styles.vendorProductDetailVariantTable}>
                      <thead>
                        <tr>
                          <th>Combination</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>SKU</th>
                          <th>Barcode</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedProductVariantRows.length
                          ? selectedProductVariantRows
                          : [
                              {
                                id: resolveProductId(selectedProduct, 0),
                                combination: "Base product",
                                price: resolveProductPrice(selectedProduct),
                                stock: resolveProductStock(selectedProduct),
                                sku: resolveProductSku(selectedProduct),
                                barcode: selectedProduct?.barcode || "N/A",
                                active: resolveProductStatus(selectedProduct) === "in-stock",
                              },
                            ]
                        ).map((variant) => (
                          <tr key={variant.id}>
                            <td>
                              <div className={styles.vendorProductDetailComboTags}>
                                {(variant.labels || [{ type: "Product", value: variant.combination }]).map(
                                  (label) => (
                                    <span key={`${variant.id}-${label.type}-${label.value}`}>
                                      {label.value}
                                    </span>
                                  )
                                )}
                              </div>
                            </td>
                            <td>{formatCurrency(variant.price)}</td>
                            <td>
                              <span
                                className={`${styles.vendorProductStatusPill} ${
                                  variant.stock > 4
                                    ? styles.vendorProductStatusPillSuccess
                                    : styles.vendorProductStatusPillWarning
                                }`}
                              >
                                {variant.stock} unit{variant.stock === 1 ? "" : "s"}
                              </span>
                            </td>
                            <td>{variant.sku || "N/A"}</td>
                            <td>{variant.barcode || "N/A"}</td>
                            <td>{variant.active ? "Active" : "Inactive"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <section className={styles.vendorProductDetailOverviewGrid}>
                  <article>
                    <h6>Product Details</h6>
                    <p><span>Name</span><strong>{resolveProductName(selectedProduct)}</strong></p>
                    <p><span>Category</span><strong>{resolveProductCategory(selectedProduct)}</strong></p>
                    <p><span>Product ID</span><strong>{resolveProductId(selectedProduct, 0)}</strong></p>
                    <p><span>Base SKU</span><strong>{resolveProductSku(selectedProduct)}</strong></p>
                    <p><span>Status</span><strong>{resolveProductStatus(selectedProduct) === "in-stock" ? "Active" : "Low Stock"}</strong></p>
                  </article>
                  <article>
                    <h6>Description</h6>
                    <p className={styles.vendorProductDetailDescription}>
                      {resolveProductDescription(selectedProduct)}
                    </p>
                  </article>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <ProductFormDesigner
          title={isEditMode ? "Edit Product" : "Add New Product"}
          isEditMode={isEditMode}
          isSubmitting={loading}
          loadingLabel={isEditMode ? "Updating..." : "Creating..."}
          submitLabel={isEditMode ? "Update Product" : "Publish Product"}
          productForm={productForm}
          onSubmit={handleCreateProduct}
          onClose={closeCreateProductModal}
          onProductNameChange={handleProductNameChange}
          onProductFormChange={handleProductFormChange}
          selectedCategory={selectedCategory}
          categoryInput={categoryInput}
          categoryOptions={availableCategories}
          showCategoryDropdown={showCategoryDropdown}
          onCategoryInputChange={handleCategoryInputChange}
          onCategorySelect={handleCategorySelect}
          onCategoryFocus={handleCategoryInputFocus}
          onCategoryBlur={handleCategoryInputBlur}
          imageInputRef={profileInputRef}
          optionImageRef={optionImageRef}
          productImageSrc={im.profile}
          onProductImageClick={() => triggerInput(profileInputRef)}
          onProductImageChange={(event) => handleImageChange(event, "profile")}
          variationsEnabled
          formErrors={formErrors}
          formMode={formMode}
          variants={variants}
          variantsDirty={variantsDirty}
          canGenerateVariants={canGenerateVariants}
          showVariationSection={showVariationSection}
          onToggleVariationSection={toggleVariationSection}
          onStartNewVariation={startNewVariation}
          variations={variations}
          currentVariation={currentVariation}
          currentOption={currentOption}
          editingVariationIndex={editingVariationIndex}
          onVariationNameChange={handleVariationNameChange}
          onVariationTypeChange={handleVariationTypeChange}
          onVariationRequiredChange={handleVariationRequiredChange}
          onOptionValueChange={handleOptionValueChange}
          onOptionDisplayNameChange={handleOptionDisplayNameChange}
          onOptionPriceChange={handleOptionPriceChange}
          onOptionStockChange={handleOptionStockChange}
          onOptionSkuChange={handleOptionSkuChange}
          onOptionDefaultChange={handleOptionDefaultChange}
          onOptionImageChange={handleOptionImageChange}
          onAddOption={addOption}
          onRemoveOption={removeOption}
          onAddVariation={addVariation}
          onEditVariation={editVariation}
          onRemoveVariation={removeVariation}
          onSavedOptionFieldChange={handleOptionFieldChange}
          onGenerateVariants={handleGenerateVariants}
          onClearVariants={handleClearVariants}
          onVariantFieldChange={handleVariantFieldChange}
          onVariantImageChange={handleVariantImageUpload}
        />
      )}

      {isCreateModalOpen && shouldRenderLegacyProductModal && (
        <div
          className={styles["modal-overlay"]}
          onClick={closeCreateProductModal}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className={styles["modal-content2"]}
            style={{
              background: "#fff",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "800px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="d-flex justify-content-between p-3">
              <h6>{isEditMode ? "Edit Product" : "Add New Product"}</h6>
              <FontAwesomeIcon
                icon={faTimes}
                onClick={closeCreateProductModal}
                style={{ cursor: "pointer" }}
              />
            </div>
            <div>
              <div className={`${styles["modal-body"]} p-3`}>
                <form onSubmit={handleCreateProduct}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label" style={{ fontSize: "15px" }}>
                          Product Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={styles["input-item"]}
                          placeholder="Product name"
                          value={productForm.name}
                          onChange={handleProductNameChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label" style={{ fontSize: "15px" }}>
                          Stock Keeping Unit(SKU)
                        </label>
                        <input
                          type="text"
                          className={styles["input-item"]}
                          placeholder="Auto-generated"
                          value={productForm.sku}
                          readOnly
                          style={{ backgroundColor: "#f5f5f5", color: "#666" }}
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="mb-2" style={{ fontSize: "15px" }}>
                          Product Description
                        </label>
                        <textarea
                          className={styles["input-item"]}
                          placeholder="Provide Product description"
                          style={{ height: "100px" }}
                          name="description"
                          value={productForm.description}
                          onChange={handleProductFormChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label" style={{ fontSize: "15px" }}>
                          Product Price <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          className={styles["input-item"]}
                          placeholder="0"
                          name="price"
                          value={productForm.price}
                          onChange={handleProductFormChange}
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label" style={{ fontSize: "15px" }}>
                          Stock
                        </label>
                        <input
                          type="number"
                          className={styles["input-item"]}
                          placeholder="0"
                          name="stock"
                          value={productForm.stock}
                          onChange={handleProductFormChange}
                        />
                      </div>
                    </div>

                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label" style={{ fontSize: "15px" }}>
                          Category
                        </label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            className={styles["input-item"]}
                            placeholder="Select or type category"
                            value={categoryInput}
                            onChange={handleCategoryInputChange}
                            onFocus={handleCategoryInputFocus}
                            onBlur={handleCategoryInputBlur}
                            style={{ width: "100%", paddingRight: "35px" }}
                          />
                          <FontAwesomeIcon
                            icon={faCaretDown}
                            style={{
                              position: "absolute",
                              right: "12px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "#78716C",
                              pointerEvents: "none",
                              fontSize: "16px",
                            }}
                          />
                          {showCategoryDropdown && filteredCategoryOptions.length > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                backgroundColor: "#fff",
                                border: "1px solid #ddd",
                                borderTop: "none",
                                borderRadius: "0 0 8px 8px",
                                maxHeight: "150px",
                                overflowY: "auto",
                                zIndex: 10,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              }}
                            >
                              {filteredCategoryOptions.map((category, index) => (
                                <div
                                  key={`${category}-${index}`}
                                  onMouseDown={() => handleCategorySelect(category)}
                                  style={{
                                    padding: "10px 12px",
                                    cursor: "pointer",
                                    backgroundColor:
                                      selectedCategory === category ? "#E8F4FF" : "#fff",
                                    borderBottom: "1px solid #f0f0f0",
                                    color: selectedCategory === category ? "#0273F9" : "#333",
                                    fontWeight:
                                      selectedCategory === category ? "500" : "normal",
                                  }}
                                >
                                  {category}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-md-12">
                      <label className="form-label" style={{ fontSize: "15px" }}>
                        Product Image
                      </label>
                      <div style={dropStyles.container}>
                        <label htmlFor="imageUpload" style={dropStyles.imageWrapper}>
                          <div
                            style={dropStyles.imageCircle}
                            onClick={() => triggerInput(profileInputRef)}
                          >
                            {im.profile ? (
                              <img src={im.profile} alt="Preview" style={dropStyles.previewImage} />
                            ) : (
                              <div style={dropStyles.placeholderCircle} />
                            )}
                          </div>

                          <input
                            type="file"
                            accept="image/*"
                            ref={profileInputRef}
                            onChange={(event) => handleImageChange(event, "profile")}
                            style={{ display: "none" }}
                          />
                          <button
                            style={dropStyles.uploadBtn}
                            onClick={() => triggerInput(profileInputRef)}
                            type="button"
                          >
                            <img src={Ac} alt="" style={{ width: "15%" }} className="me-2" />
                            Upload Image
                          </button>
                        </label>
                        <p style={dropStyles.note}>
                          Recommended: Square image, at least 300x300px
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <button
                      type="button"
                      onClick={toggleVariationSection}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0273F9",
                        cursor: "pointer",
                        fontSize: "15px",
                        padding: "8px 0",
                        fontWeight: "500",
                      }}
                    >
                      {showVariationSection ? "− Hide Variations" : "+ Add Variations"}
                    </button>
                  </div>

                  {showVariationSection && (
                    <div className="rounded-3 mt-4" style={{ border: "1px solid #eee" }}>
                      <small className="d-block mx p-2">Variation (Optional)</small>

                      <hr className="m-0" style={{ border: "1px solid #eee" }} />

                      <div
                        className="m-3 p-3"
                        style={{ border: "1px solid #eee", background: "#fafafa" }}
                      >
                        <h6 className="mb-3">Add Variation</h6>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label" style={{ fontSize: "13px" }}>
                                Variant Name
                              </label>
                              <input
                                type="text"
                                className={styles["input-item"]}
                                placeholder="e.g., Color, Size"
                                value={currentVariation.variation_name}
                                onChange={handleVariationNameChange}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label" style={{ fontSize: "13px" }}>
                                Variant Type
                              </label>
                              <select
                                className={styles["input-item"]}
                                style={{ fontSize: "13px" }}
                                value={currentVariation.variation_type}
                                onChange={handleVariationTypeChange}
                              >
                                <option value="">--select type--</option>
                                <option value="color">Color</option>
                                <option value="size">Size</option>
                                <option value="material">Material</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <hr className="my-3" style={{ border: "1px solid #ddd" }} />
                        <h6 className="mb-3">Add Option Values</h6>
                        <div className="row">
                          <div className="col-md-3">
                            <div className="mb-3">
                              <label className="form-label" style={{ fontSize: "12px" }}>
                                Option Value
                              </label>
                              <input
                                type="text"
                                className={styles["input-item"]}
                                placeholder="e.g., Red, Large"
                                value={currentOption.value}
                                onChange={handleOptionValueChange}
                                style={{ fontSize: "12px" }}
                              />
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="mb-3">
                              <label className="form-label" style={{ fontSize: "12px" }}>
                                Price
                              </label>
                              <input
                                type="number"
                                className={styles["input-item"]}
                                placeholder="0.00"
                                value={currentOption.price}
                                onChange={handleOptionPriceChange}
                                step="0.01"
                                style={{ fontSize: "12px" }}
                              />
                            </div>
                          </div>
                          <div className="col-md-2">
                            <div className="mb-3">
                              <label className="form-label" style={{ fontSize: "12px" }}>
                                Stock
                              </label>
                              <input
                                type="number"
                                className={styles["input-item"]}
                                placeholder="0"
                                value={currentOption.stock}
                                onChange={handleOptionStockChange}
                                style={{ fontSize: "12px" }}
                              />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="mb-3">
                              <label className="form-label" style={{ fontSize: "12px" }}>
                                Option Image
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                ref={optionImageRef}
                                onChange={handleOptionImageChange}
                                style={{ fontSize: "12px" }}
                                className={styles["input-item"]}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <button
                            type="button"
                            onClick={addOption}
                            className={`${styles["sk-btn"]} me-2`}
                            style={{ fontSize: "13px" }}
                          >
                            Add Option
                          </button>
                        </div>

                        {currentVariation.options.length > 0 && (
                          <div className="mb-3">
                            <h6 className="mb-2" style={{ fontSize: "13px" }}>
                              Options Added:
                            </h6>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                              {currentVariation.options.map((option, index) => (
                                <div
                                  key={`${option.value}-${index}`}
                                  style={{
                                    background: "#E8F4FF",
                                    border: "1px solid #0273F9",
                                    borderRadius: "6px",
                                    padding: "8px 12px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    fontSize: "12px",
                                  }}
                                >
                                  <span>
                                    {option.value} - ${option.price} (Stock: {option.stock})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeOption(index)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: "#DC2626",
                                      cursor: "pointer",
                                      padding: 0,
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={addVariation}
                            className={styles["si-btn"]}
                            style={{ fontSize: "13px" }}
                          >
                            Add Variation
                          </button>
                        </div>
                      </div>

                      {variations.length > 0 && (
                        <div className="m-3 p-3" style={{ background: "#fafafa" }}>
                          <h6 className="mb-3">Variations Added:</h6>
                          {variations.map((variation, index) => (
                            <div
                              key={`${variation.variation_name}-${index}`}
                              style={{
                                background: "#fff",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                padding: "12px",
                                marginBottom: "10px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "10px",
                                }}
                              >
                                <div>
                                  <strong style={{ fontSize: "14px" }}>
                                    {variation.variation_name}
                                  </strong>
                                  <span
                                    style={{
                                      fontSize: "12px",
                                      color: "#666",
                                      marginLeft: "10px",
                                    }}
                                  >
                                    Type: {variation.variation_type}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeVariation(index)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#DC2626",
                                    cursor: "pointer",
                                    fontSize: "18px",
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                              <div style={{ fontSize: "12px" }}>
                                <strong>Options:</strong>
                                <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
                                  {variation.options.map((option, optionIndex) => (
                                    <li key={`${option.value}-${optionIndex}`}>
                                      {option.value} - ${option.price} (Stock: {option.stock})
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3">
                    <label className="form-label" style={{ fontSize: "15px" }}>
                      Image Url
                    </label>
                    <input
                      type="text"
                      className={styles["input-item"]}
                      placeholder="Enter Image url"
                      name="image_url"
                      value={productForm.image_url}
                      onChange={handleProductFormChange}
                    />
                  </div>
                  <div className="text-end mt-4 m-4">
                    <button
                      type="button"
                      className={`${styles["sk-btn"]} me-2`}
                      onClick={closeCreateProductModal}
                    >
                      Cancel
                    </button>
                    <button className={`${styles["si-btn"]} btn-lg px-5 py-3`} disabled={loading}>
                      {loading ? (
                        <>
                          <div className="spinner-border spinner-border-sm text-light" role="status">
                            <span className="sr-only" />
                          </div>
                          <span>{isEditMode ? "Updating... " : "Creating... "}</span>
                        </>
                      ) : (
                        isEditMode ? "Update Product" : "Add Product"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;
