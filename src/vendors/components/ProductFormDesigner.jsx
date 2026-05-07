import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCircleInfo,
  faImage,
  faPen,
  faPlus,
  faTrashCan,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import styles from "../../styles.module.css";
import { getImageSrc } from "../../utils/getImageSrc";

const QUICK_OPTIONS = {
  color: ["Red", "Blue", "White", "Green", "Grey", "Navy", "Pink"],
  colour: ["Red", "Blue", "White", "Green", "Grey", "Navy", "Pink"],
  size: ["XS", "S", "M", "L", "XL", "XXL", "36"],
  material: ["Cotton", "Leather", "Wool", "Silk", "Denim"],
  style: ["Classic", "Modern", "Casual", "Formal", "Sport"],
  weight: ["Light", "Medium", "Heavy"],
};

const VARIATION_TYPE_OPTIONS = [
  { value: "", label: "Select type" },
  { value: "color", label: "Color" },
  { value: "size", label: "Size" },
  { value: "material", label: "Material" },
  { value: "style", label: "Style" },
  { value: "weight", label: "Weight" },
  { value: "other", label: "Other" },
];

const formatNumber = (value) => {
  const amount = Number(value) || 0;
  return amount.toLocaleString("en-NG");
};

const toNumericValue = (value, fallback = 0) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : fallback;
};

const normalizeVariationType = (value = "") => {
  const normalizedValue = String(value).trim().toLowerCase();

  if (normalizedValue === "colour") return "color";
  if (normalizedValue === "custom") return "other";

  return normalizedValue;
};

const inferVariationType = (value = "") => {
  const normalizedValue = normalizeVariationType(value);

  if (!normalizedValue) return "";
  if (VARIATION_TYPE_OPTIONS.some((option) => option.value === normalizedValue)) {
    return normalizedValue;
  }
  if (normalizedValue.includes("color") || normalizedValue.includes("colour")) return "color";
  if (normalizedValue.includes("size")) return "size";
  if (normalizedValue.includes("material") || normalizedValue.includes("fabric")) return "material";
  if (normalizedValue.includes("style")) return "style";
  if (normalizedValue.includes("weight")) return "weight";

  return "";
};

const resolveVariationType = (typeValue = "", nameValue = "") =>
  inferVariationType(typeValue) || inferVariationType(nameValue) || (typeValue || nameValue ? "other" : "");

const normalizeVariation = (variation = {}) => ({
  variation_name: variation?.variation_name || variation?.name || "",
  variation_type: resolveVariationType(
    variation?.variation_type || variation?.type || "",
    variation?.variation_name || variation?.name || ""
  ),
  is_required:
    variation?.is_required === true ||
    variation?.is_required === 1 ||
    variation?.is_required === "1" ||
    variation?.is_required === "true",
  options: Array.isArray(variation?.options)
    ? variation.options.filter((option) => option && typeof option === "object")
    : [],
});

const getVariationTypeBadgeClass = (variationType = "") => {
  switch (normalizeVariationType(variationType)) {
    case "color":
      return styles.productDesignerVariationBadgeColor;
    case "size":
      return styles.productDesignerVariationBadgeSize;
    case "material":
      return styles.productDesignerVariationBadgeMaterial;
    case "style":
      return styles.productDesignerVariationBadgeStyle;
    case "weight":
      return styles.productDesignerVariationBadgeWeight;
    default:
      return styles.productDesignerVariationBadgeOther;
  }
};

const toSkuToken = (value = "") => {
  const normalizedValue = String(value)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalizedValue || "OPT";
};

const getVariationLabel = (variation = {}, fallbackIndex = 0) =>
  variation?.variation_name ||
  variation?.variation_type ||
  `Variation ${fallbackIndex + 1}`;

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

const getVariantCombinations = (variationList = [], baseSku = "") => {
  const validVariations = variationList
    .map(normalizeVariation)
    .filter((variation) => variation.options.length > 0);

  if (!validVariations.length) return [];

  return validVariations.reduce((rows, variation) => {
    if (rows.length === 0) {
      return variation.options.map((option) => ({
        labels: [option.value || option.option_value || "Option"],
        skuSegments: [
          {
            value: option?.sku || option.value || option.option_value || option.display_name || "OPT",
            isExplicit: Boolean(String(option?.sku || "").trim()),
          },
        ],
        price: Number(option.price) || 0,
        stock: Number(option.stock) || 0,
        options: [
          {
            variation_name: variation.variation_name || variation.variation_type || "Variation",
            option_value: option.value || option.option_value || option.display_name || "",
          },
        ],
      }));
    }

    return rows.flatMap((row) =>
      variation.options.map((option) => ({
        labels: [...row.labels, option.value || option.option_value || "Option"],
        skuSegments: [
          ...row.skuSegments,
          {
            value: option?.sku || option.value || option.option_value || option.display_name || "OPT",
            isExplicit: Boolean(String(option?.sku || "").trim()),
          },
        ],
        price: row.price + (Number(option.price) || 0),
        stock: Math.min(row.stock, Number(option.stock) || 0),
        options: [
          ...(Array.isArray(row.options) ? row.options : []),
          {
            variation_name: variation.variation_name || variation.variation_type || "Variation",
            option_value: option.value || option.option_value || option.display_name || "",
          },
        ],
      }))
    );
  }, []).map((row) => ({
    ...row,
    sku: resolveVariantSku(row.skuSegments, baseSku),
  }));
};

const ProductFormDesigner = ({
  isOpen = true,
  title = "Add New Product",
  subtitle = "Fill in the product details. Use variations for products with multiple options.",
  isEditMode = false,
  isSubmitting = false,
  submitLabel,
  loadingLabel,
  productForm,
  onSubmit,
  onClose,
  onProductNameChange,
  onProductFormChange,
  selectedCategory,
  categoryInput,
  categoryOptions = [],
  categoriesLoading = false,
  showCategoryDropdown = false,
  onCategoryInputChange,
  onCategorySelect,
  onCategoryFocus,
  onCategoryBlur,
  imageInputRef,
  optionImageRef,
  productImageSrc,
  onProductImageChange,
  onProductImageClick,
  imageUrlEnabled = true,
  variationsEnabled = true,
  formErrors = {},
  showVariationSection = false,
  onToggleVariationSection,
  variations = [],
  formMode = "simple",
  variants = [],
  variantsDirty = false,
  canGenerateVariants = false,
  currentVariation,
  currentOption,
  editingVariationIndex = null,
  onVariationNameChange,
  onVariationTypeChange,
  onVariationRequiredChange,
  onOptionValueChange,
  onOptionDisplayNameChange,
  onOptionPriceChange,
  onOptionStockChange,
  onOptionSkuChange,
  onOptionDefaultChange,
  onOptionImageChange,
  onQuickOption,
  onAddOption,
  onRemoveOption,
  onAddVariation,
  onEditVariation,
  onRemoveVariation,
  onStartNewVariation,
  onSavedOptionFieldChange,
  onGenerateVariants,
  onClearVariants,
  onVariantFieldChange,
  onVariantImageChange,
  canToggleVisibility = false,
  canMarkFeatured = false,
}) => {
  if (!isOpen) return null;

  const [openVariantDetailIndex, setOpenVariantDetailIndex] = React.useState(null);

  const normalizedVariations = variations.map(normalizeVariation);
  const safeCurrentVariationOptions = Array.isArray(currentVariation?.options)
    ? currentVariation.options.filter((option) => option && typeof option === "object")
    : [];
  const currentOptionImageSrc =
    typeof currentOption?.image_url === "string" ? getImageSrc(currentOption.image_url) : "";
  const variantCombinations = getVariantCombinations(normalizedVariations, productForm?.sku);
  const selectedCategoryValue = selectedCategory || categoryInput;
  const categoryChips = categoryOptions.slice(0, 6);
  const quickKey = (currentVariation?.variation_type || currentVariation?.variation_name || "")
    .trim()
    .toLowerCase();
  const quickOptions = QUICK_OPTIONS[quickKey] || QUICK_OPTIONS[quickKey.replace(/\s+/g, "")] || [];
  const hasVariations = normalizedVariations.length > 0;
  const isSimpleMode = formMode === "simple";
  const isVariationMode = formMode === "variations";
  const isVariantMode = formMode === "variants";
  const baseProductPrice = toNumericValue(productForm?.price);
  const baseProductStock = toNumericValue(productForm?.stock);
  const totalVariantStock = variantCombinations.reduce(
    (total, variant) => total + (Number(variant.stock) || 0),
    0
  );
  const variantPrices = variantCombinations.map((variant) => toNumericValue(variant.price));
  const minVariantPrice = variantPrices.length ? Math.min(...variantPrices) : baseProductPrice;
  const maxVariantPrice = variantPrices.length ? Math.max(...variantPrices) : baseProductPrice;
  const priceSummaryValue =
    hasVariations && maxVariantPrice > minVariantPrice
      ? `₦${formatNumber(minVariantPrice)} - ₦${formatNumber(maxVariantPrice)}`
      : `₦${formatNumber(hasVariations ? minVariantPrice : baseProductPrice)}`;
  const variantRows = Array.isArray(variants) ? variants : [];
  const enabledVariantRows = variantRows.filter((variant) => variant?.enabled !== false);
  const variantSummaryRows = enabledVariantRows.length > 0 ? enabledVariantRows : variantRows;
  const variationTypeCountLabel = `${normalizedVariations.length} variation type${
    normalizedVariations.length === 1 ? "" : "s"
  }`;
  const variationTableGroups = normalizedVariations
    .map((variation, variationIndex) => ({
      ...variation,
      variationIndex,
      rows: (Array.isArray(variation?.options) ? variation.options : []).map((option, optionIndex) => ({
        ...option,
        optionIndex,
      })),
    }))
    .filter((variation) => variation.rows.length > 0);
  const canGenerateVariantRows =
    canGenerateVariants ||
    normalizedVariations.filter((variation) =>
      variation.options.some((option) => String(option?.value || "").trim())
    ).length > 1;
  const variantSummaryPrices = variantSummaryRows
    .map((variant) => toNumericValue(variant?.price, NaN))
    .filter((price) => Number.isFinite(price));
  const minGeneratedVariantPrice = variantSummaryPrices.length
    ? Math.min(...variantSummaryPrices)
    : minVariantPrice;
  const maxGeneratedVariantPrice = variantSummaryPrices.length
    ? Math.max(...variantSummaryPrices)
    : maxVariantPrice;
  const generatedVariantStock = variantSummaryRows.reduce(
    (sum, variant) => sum + Math.max(0, toNumericValue(variant?.stock)),
    0
  );
  const resolvedPriceSummaryValue =
    variantRows.length > 0 && maxGeneratedVariantPrice > minGeneratedVariantPrice
      ? `₦${formatNumber(minGeneratedVariantPrice)} - ₦${formatNumber(maxGeneratedVariantPrice)}`
      : variantRows.length > 0
        ? `₦${formatNumber(minGeneratedVariantPrice)}`
        : priceSummaryValue;
  const resolvedSummaryStockValue =
    variantRows.length > 0 ? generatedVariantStock : hasVariations ? totalVariantStock : baseProductStock;
  const resolvedSummaryVariantCount =
    variantRows.length > 0 ? variantRows.length : hasVariations ? variantCombinations.length : 1;
  const resolvedPriceValue = productForm?.price ?? "";
  const resolvedStockValue = productForm?.stock ?? "";

  const handleQuickOptionClick = (value) => {
    if (onOptionValueChange) {
      onOptionValueChange({ target: { value } });
    }
  };

  const getError = (path) => formErrors?.[path];

  const renderFieldError = (path) =>
    getError(path) ? (
      <small className={styles.productDesignerFieldError}>{getError(path)}</small>
    ) : null;

  const renderTextInput = ({
    label,
    name,
    value,
    onChange,
    placeholder,
    required,
    readOnly,
    disabled,
    type = "text",
    helperText,
    error,
    inputProps = {},
  }) => (
    <label className={styles.productDesignerField}>
      <span>
        {label} {required && <b>*</b>}
      </span>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        {...inputProps}
      />
      {error ? <small className={styles.productDesignerFieldError}>{error}</small> : null}
      {helperText ? <small className={styles.productDesignerFieldHelp}>{helperText}</small> : null}
    </label>
  );

  const renderPrimaryActions = (className) => (
    <div className={className}>
      <button type="submit" className={styles.productDesignerGhostButton}>
        Save Draft
      </button>
      <button type="submit" className={styles.productDesignerPrimaryButton} disabled={isSubmitting}>
        {isSubmitting ? (
          loadingLabel || (isEditMode ? "Updating..." : "Publishing...")
        ) : (
          <>
            <span className={styles.productDesignerPublishIcon}>
              <FontAwesomeIcon icon={faCheck} />
            </span>
            {submitLabel || (isEditMode ? "Update Product" : "Publish Product")}
          </>
        )}
      </button>
    </div>
  );

  const renderCloseButton = (className) => (
    <div className={className}>
      <button type="button" className={styles.productDesignerCloseButton} onClick={onClose}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
    </div>
  );

  const renderVariationValueTag = (label, variationType, key) => (
    <span
      key={key}
      className={`${styles.productDesignerCompactValueTag} ${
        styles[`productDesignerCompactValueTag${normalizeVariationType(variationType).charAt(0).toUpperCase()}${normalizeVariationType(variationType).slice(1)}`] ||
        styles.productDesignerCompactValueTagOther
      }`}
    >
      {label}
    </span>
  );

  const renderStatusPill = (label, isActive = true) => (
    <span
      className={`${styles.productDesignerStatusPill} ${
        isActive ? styles.productDesignerStatusPillActive : styles.productDesignerStatusPillMuted
      }`}
    >
      <span className={styles.productDesignerStatusDot} />
      {label}
    </span>
  );

  return (
    <div className={styles.productDesignerOverlay} onClick={onClose}>
      <div className={styles.productDesignerShell} onClick={(event) => event.stopPropagation()}>
        <form className={styles.productDesignerForm} onSubmit={onSubmit}>
          <div className={styles.productDesignerTopbar}>
            <div className={styles.productDesignerHeaderCopy}>
              <div className={styles.productDesignerMobileBreadcrumbRow}>
                {renderCloseButton(styles.productDesignerMobileCloseAction)}
                <div className={styles.productDesignerBreadcrumb}>
                  <span>Products</span>
                  <span>/</span>
                  <span>{title}</span>
                </div>
              </div>
              <div className={styles.productDesignerDesktopBreadcrumb}>
                <span>Products</span>
                <span>/</span>
                <span>{title}</span>
              </div>
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>

            <div className={styles.productDesignerTopbarActions}>
              {renderCloseButton(styles.productDesignerCloseAction)}
              {renderPrimaryActions(styles.productDesignerDesktopActions)}
            </div>
          </div>

          <div className={styles.productDesignerGrid}>
            <main className={styles.productDesignerMain}>
              <section className={styles.productDesignerCard}>
                <div className={styles.productDesignerCardHeader}>
                  <h3>
                    <span />
                    Basic Information
                  </h3>
                  <small>Draft</small>
                </div>

                <div className={styles.productDesignerCardBody}>
                  <div className={styles.productDesignerTwoCols}>
                    {renderTextInput({
                      label: "Product Name",
                      name: "name",
                      value: productForm?.name,
                      onChange: onProductNameChange,
                      placeholder: "e.g. Nike",
                      required: true,
                      error: getError("name"),
                    })}

                    {renderTextInput({
                      label: "SKU",
                      name: "sku",
                      value: productForm?.sku,
                      onChange: onProductFormChange,
                      placeholder: "e.g. NIKE-BLK-M",
                      helperText: "Use the base SKU for the product. Variant SKUs are generated from the option payload below.",
                      error: getError("sku"),
                    })}
                  </div>

                  <label className={styles.productDesignerField}>
                    <span>Description</span>
                    <textarea
                      name="description"
                      value={productForm?.description ?? ""}
                      onChange={onProductFormChange}
                      placeholder="Describe your product, materials, features, care instructions..."
                      rows={4}
                    />
                    {renderFieldError("description")}
                  </label>

                  <div className={styles.productDesignerThreeCols}>
                    {renderTextInput({
                      label: "Price",
                      name: "price",
                      value: resolvedPriceValue,
                      onChange: onProductFormChange,
                      placeholder: "0.00",
                      required: isSimpleMode,
                      type: "number",
                      disabled: !isSimpleMode,
                      helperText: isSimpleMode
                        ? "Base product price when no variations are configured."
                        : isVariantMode
                          ? "Price and stock are managed per variant below."
                          : "Price and stock are managed per variation option.",
                      inputProps: {
                        min: "0.01",
                        step: "0.01",
                      },
                      error: getError("price"),
                    })}
                    {renderTextInput({
                      label: "Stock",
                      name: "stock",
                      value: resolvedStockValue,
                      onChange: onProductFormChange,
                      placeholder: "0",
                      required: isSimpleMode,
                      type: "number",
                      disabled: !isSimpleMode,
                      helperText: isSimpleMode
                        ? "Available units when no variations are configured."
                        : isVariantMode
                          ? "Price and stock are managed per variant below."
                          : "Price and stock are managed per variation option.",
                      inputProps: {
                        min: "0",
                        step: "1",
                      },
                      error: getError("stock"),
                    })}
                    {renderTextInput({
                      label: "Sort Order",
                      name: "sort_order",
                      value: productForm?.sort_order ?? "",
                      onChange: onProductFormChange,
                      placeholder: "1",
                      type: "number",
                      helperText: "Controls the product position when products are sorted manually.",
                      inputProps: {
                        min: "1",
                        step: "1",
                      },
                      error: getError("sort_order"),
                    })}
                  </div>

                  {!isSimpleMode && (
                    <p className={styles.productDesignerInlineHint}>
                      {isVariantMode
                        ? "Base product price and stock are inactive here. Manage them on each enabled variant row below."
                        : "Base product price and stock are inactive here. Manage them on each variation option instead."}
                    </p>
                  )}
                </div>
              </section>

              {variationsEnabled && (
                <>
                  <div className={styles.productDesignerNotice}>
                    <FontAwesomeIcon icon={faCircleInfo} />
                    <p>
                      <strong>Use variation options for per-option pricing, or generate variants for combination pricing.</strong>{" "}
                      Add variation types like color, size, or material, then generate variants when
                      you want combinations like Color + Size.
                    </p>
                  </div>

                  <section className={styles.productDesignerCard}>
                    <div className={styles.productDesignerCardHeader}>
                      <h3>
                        <span />
                        Variations
                      </h3>
                      <small>{variationTypeCountLabel}</small>
                    </div>

                    <div className={styles.productDesignerCardBody}>
                      <div className={styles.productDesignerVariationGuide}>
                        <strong>{"Variation -> Options -> Variants (combinations)"}</strong>
                        <div className={styles.productDesignerVariationFlow}>
                          <div>
                            <small>Variation 1</small>
                            <b>e.g. Colour</b>
                            <p>Red, Blue, Black</p>
                          </div>
                          <span>×</span>
                          <div>
                            <small>Variation 2</small>
                            <b>e.g. Size</b>
                            <p>S, M, L</p>
                          </div>
                          <span>→</span>
                          <div>
                            <small>Auto-generated</small>
                            <b>Variants</b>
                            <p>Red S, Blue M, Black L</p>
                          </div>
                        </div>
                        <p>
                          Each generated variant has its own <strong>price, stock, SKU</strong> and optional
                          image. Add your variation types first, then generate variants when you want
                          combination pricing below.
                        </p>
                      </div>

                      {!hasVariations && !showVariationSection && (
                        <div className={styles.productDesignerVariationEmptyState}>
                          <strong>No variations added. Click "Add Variation" to start.</strong>
                          <p>
                            Add a variation when this product comes in different colours, sizes,
                            materials, or other options.
                          </p>
                        </div>
                      )}

                      <div className={styles.productDesignerVariationActionRow}>
                        <button
                          type="button"
                          className={styles.productDesignerDashedButton}
                          onClick={onStartNewVariation || onToggleVariationSection}
                        >
                          <FontAwesomeIcon icon={faPlus} />
                          {normalizedVariations.length > 0
                            ? "Add another variation type"
                            : "Add Variation"}
                        </button>
                      </div>

                      {showVariationSection && (
                        <div className={styles.productDesignerVariationEditor}>
                          <div className={styles.productDesignerVariationHeader}>
                            <div>
                              <strong>
                                {editingVariationIndex !== null
                                  ? `Edit ${currentVariation?.variation_name || "variation"}`
                                  : currentVariation?.variation_name || "New variation"}
                              </strong>
                            </div>
                            <small>{currentVariation?.options?.length || 0} options</small>
                          </div>

                          <div className={styles.productDesignerVariationMetaGrid}>
                            <label className={styles.productDesignerField}>
                              <span>Variation Type</span>
                              <select
                                value={currentVariation?.variation_type ?? ""}
                                onChange={onVariationTypeChange}
                              >
                                {VARIATION_TYPE_OPTIONS.map((option) => (
                                  <option
                                    key={option.value || "placeholder"}
                                    value={option.value}
                                    disabled={option.value === ""}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            {renderTextInput({
                              label: "Variation Name",
                              value: currentVariation?.variation_name,
                              onChange: onVariationNameChange,
                              placeholder: "Color",
                            })}
                          </div>

                          {onVariationRequiredChange && (
                            <label className={styles.productDesignerCheckboxLine}>
                              <input
                                type="checkbox"
                                checked={!!currentVariation?.is_required}
                                onChange={onVariationRequiredChange}
                              />
                              Required variation
                            </label>
                          )}

                          {quickOptions.length > 0 && (
                            <div className={styles.productDesignerQuickAdd}>
                              <small>Quick add:</small>
                              {quickOptions.map((option) => (
                                <button
                                  type="button"
                                  key={option}
                                  onClick={() => handleQuickOptionClick(option)}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className={styles.productDesignerOptionComposer}>
                            <div className={styles.productDesignerOptionComposerHeader}>
                              <div>
                                <strong>Variation Option</strong>
                                <p>
                                  Add the option details for this variation, then save the option into
                                  the table below.
                                </p>
                              </div>
                            </div>

                            {isVariantMode && (
                              <p className={styles.productDesignerInlineHint}>
                                Price and stock are managed per variant below.
                              </p>
                            )}

                            <div className={styles.productDesignerOptionComposerGrid}>
                              {renderTextInput({
                                label: "Value",
                                value: currentOption?.value,
                                onChange: onOptionValueChange,
                                placeholder: "Black",
                              })}
                              {renderTextInput({
                                label: "Display Name",
                                value: currentOption?.display_name,
                                onChange: onOptionDisplayNameChange || onOptionValueChange,
                                placeholder: "Black",
                              })}
                              {renderTextInput({
                                label: "Price",
                                value: currentOption?.price,
                                onChange: onOptionPriceChange,
                                placeholder: "0",
                                type: "number",
                                disabled: isVariantMode,
                                helperText: isVariantMode
                                  ? "Price and stock are managed per variant below."
                                  : "Required when pricing is managed per variation option.",
                                inputProps: {
                                  min: "0",
                                  step: "0.01",
                                },
                              })}
                              {renderTextInput({
                                label: "Stock",
                                value: currentOption?.stock,
                                onChange: onOptionStockChange,
                                placeholder: "0",
                                type: "number",
                                disabled: isVariantMode,
                                helperText: isVariantMode
                                  ? "Price and stock are managed per variant below."
                                  : undefined,
                                inputProps: {
                                  min: "0",
                                  step: "1",
                                },
                              })}
                              {renderTextInput({
                                label: "SKU",
                                value: currentOption?.sku,
                                onChange: onOptionSkuChange,
                                placeholder: "Optional",
                              })}
                            </div>

                            <div className={styles.productDesignerOptionMediaRow}>
                              <button
                                type="button"
                                className={styles.productDesignerOptionMediaButton}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  optionImageRef?.current?.click();
                                }}
                              >
                                {currentOptionImageSrc ? (
                                  <img src={currentOptionImageSrc} alt="Option preview" />
                                ) : (
                                  <>
                                    <span>
                                      <FontAwesomeIcon icon={faImage} />
                                    </span>
                                    <small>Option image</small>
                                  </>
                                )}
                              </button>

                              <div className={styles.productDesignerOptionMediaCopy}>
                                <strong>Option Image Upload</strong>
                                <p>
                                  Uploaded files are sent as <code>variation_option_image_*_*</code> with
                                  the matching variation and option indexes.
                                </p>
                                {onOptionDefaultChange && (
                                  <label className={styles.productDesignerCheckboxLine}>
                                    <input
                                      type="checkbox"
                                      checked={!!currentOption?.is_default}
                                      onChange={onOptionDefaultChange}
                                    />
                                    Default option for this variation
                                  </label>
                                )}
                              </div>

                              <button
                                type="button"
                                className={styles.productDesignerPrimarySmall}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  onAddOption?.();
                                }}
                              >
                                <FontAwesomeIcon icon={faPlus} />
                                Save option
                              </button>
                            </div>

                            <input
                              type="file"
                              accept="image/*"
                              ref={optionImageRef}
                              onChange={onOptionImageChange}
                              hidden
                            />
                          </div>

                          <button
                            type="button"
                            className={styles.productDesignerPrimarySmall}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              onAddVariation?.();
                            }}
                          >
                            {editingVariationIndex !== null ? "Update variation" : "Save variation"}
                          </button>

                          {safeCurrentVariationOptions.length > 0 && (
                            <div className={styles.productDesignerOptionDraftTableWrap}>
                              <table className={styles.productDesignerOptionDraftTable}>
                                <thead>
                                  <tr>
                                    <th>Img</th>
                                    <th>Option</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>SKU</th>
                                    <th>Status</th>
                                    <th />
                                  </tr>
                                </thead>
                                <tbody>
                                  {safeCurrentVariationOptions.map((option, index) => (
                                    <tr key={`${option.value}-${index}`}>
                                      <td>
                                        <div className={styles.productDesignerOptionDraftImage}>
                                          {option.image_url ? (
                                            <img src={getImageSrc(option.image_url)} alt={option.value || ""} />
                                          ) : (
                                            <FontAwesomeIcon icon={faImage} />
                                          )}
                                        </div>
                                      </td>
                                      <td>
                                        <div className={styles.productDesignerOptionDraftCopy}>
                                          {renderVariationValueTag(
                                            option.display_name || option.value || `Option ${index + 1}`,
                                            currentVariation?.variation_type,
                                            `draft-option-${index}`
                                          )}
                                          <small>{option.value || "No raw option value set"}</small>
                                        </div>
                                      </td>
                                      <td>
                                        <span className={styles.productDesignerOptionDraftValue}>
                                          ₦{formatNumber(option.price)}
                                        </span>
                                      </td>
                                      <td>
                                        <span className={styles.productDesignerOptionDraftValue}>
                                          {Number(option.stock) || 0}
                                        </span>
                                      </td>
                                      <td>
                                        <span className={styles.productDesignerOptionDraftValue}>
                                          {option.sku || "Auto"}
                                        </span>
                                      </td>
                                      <td>
                                        {option.is_default ? (
                                          <span className={styles.productDesignerOptionFlag}>Default</span>
                                        ) : (
                                          <span className={styles.productDesignerOptionFlagMuted}>Saved</span>
                                        )}
                                      </td>
                                      <td>
                                        <button
                                          type="button"
                                          className={styles.productDesignerDeleteIconButton}
                                          aria-label={`Remove ${
                                            option.display_name || option.value || `option ${index + 1}`
                                          }`}
                                          onClick={() => onRemoveOption?.(index)}
                                        >
                                          <FontAwesomeIcon icon={faTrashCan} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {isVariantMode && variationTableGroups.length > 0 && (
                        <p className={styles.productDesignerInlineHint}>
                          Price and stock are managed per variant below.
                        </p>
                      )}

                      {variationTableGroups.map((variation) => (
                        <div
                          className={styles.productDesignerSavedVariation}
                          key={`${getVariationLabel(variation, variation.variationIndex)}-${variation.variationIndex}`}
                        >
                          <div className={styles.productDesignerSavedVariationTop}>
                            <div>
                              <small>Variation {variation.variationIndex + 1}</small>
                              <strong>{getVariationLabel(variation, variation.variationIndex)}</strong>
                              <span
                                className={`${styles.productDesignerVariationTypeBadge} ${getVariationTypeBadgeClass(
                                  variation.variation_type
                                )}`}
                              >
                                {variation.variation_type || `variation ${variation.variationIndex + 1}`}
                              </span>
                            </div>
                            <div>
                              <small>{variation.rows.length} options</small>
                              {onEditVariation && (
                                <button type="button" onClick={() => onEditVariation(variation.variationIndex)}>
                                  Edit
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onRemoveVariation?.(variation.variationIndex)}
                              >
                                <FontAwesomeIcon icon={faTrashCan} />
                              </button>
                            </div>
                          </div>

                          <div className={styles.productDesignerCompactTableWrap}>
                            <table className={styles.productDesignerCompactTable}>
                              <thead>
                                <tr>
                                  <th>Variant (Option)</th>
                                  <th>Price (₦)</th>
                                  <th>Stock</th>
                                  <th>Status</th>
                                  <th />
                                </tr>
                              </thead>
                              <tbody>
                                {variation.rows.map((option) => (
                                  <tr key={`${option.value}-${option.optionIndex}`}>
                                    <td>
                                      <div className={styles.productDesignerCompactVariantCell}>
                                        {renderVariationValueTag(
                                          option.display_name || option.value || `Option ${option.optionIndex + 1}`,
                                          variation.variation_type,
                                          `variation-${variation.variationIndex}-${option.optionIndex}`
                                        )}
                                        {option.is_default ? (
                                          <span className={styles.productDesignerCompactMetaTag}>Default</span>
                                        ) : null}
                                      </div>
                                    </td>
                                    <td>
                                      <div className={styles.productDesignerCompactInputWrap}>
                                        <span>₦</span>
                                        <input
                                          type="number"
                                          value={option?.price ?? ""}
                                          disabled={isVariantMode}
                                          onChange={(event) =>
                                            onSavedOptionFieldChange?.(
                                              variation.variationIndex,
                                              option.optionIndex,
                                              "price",
                                              event.target.value
                                            )
                                          }
                                          min="0"
                                          step="0.01"
                                          placeholder="0"
                                        />
                                      </div>
                                      {renderFieldError(
                                        `variations.${variation.variationIndex}.options.${option.optionIndex}.price`
                                      )}
                                    </td>
                                    <td>
                                        <input
                                          className={styles.productDesignerCompactTableInput}
                                          type="number"
                                          value={option?.stock ?? ""}
                                          disabled={isVariantMode}
                                          onChange={(event) =>
                                            onSavedOptionFieldChange?.(
                                              variation.variationIndex,
                                            option.optionIndex,
                                            "stock",
                                            event.target.value
                                          )
                                        }
                                        min="0"
                                        step="1"
                                        placeholder="0"
                                      />
                                      {renderFieldError(
                                        `variations.${variation.variationIndex}.options.${option.optionIndex}.stock`
                                      )}
                                    </td>
                                    <td>{renderStatusPill("Active", true)}</td>
                                    <td>
                                      <button
                                        type="button"
                                        className={styles.productDesignerTableActionButton}
                                        onClick={() => onEditVariation?.(variation.variationIndex)}
                                        aria-label={`Edit ${option.display_name || option.value || "option"}`}
                                      >
                                        <FontAwesomeIcon icon={faPen} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}

                      {hasVariations && variantRows.length === 0 && (
                        <>
                          <p className={styles.productDesignerInlineHint}>
                            {canGenerateVariantRows
                              ? "Generate variants when you want to manage price and stock per combination."
                              : "These variations stand on their own, so price and stock stay on each variation option."}
                          </p>
                          {canGenerateVariantRows && (
                            <div className={styles.productDesignerVariationActionRow}>
                              <button
                                type="button"
                                className={styles.productDesignerPrimarySmall}
                                onClick={onGenerateVariants}
                              >
                                Generate Variants
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {renderFieldError("variants")}
                    </div>
                  </section>

                  {variantRows.length > 0 && (
                    <section className={styles.productDesignerCard}>
                      <div className={styles.productDesignerCardHeader}>
                        <h3>
                          <span />
                          Generated Variants
                        </h3>
                        <small>{variantRows.length} variants</small>
                      </div>

                      <div className={styles.productDesignerCardBody}>
                        <div className={styles.productDesignerVariationActionRow}>
                          {variantsDirty && (
                            <button
                              type="button"
                              className={styles.productDesignerPrimarySmall}
                              onClick={onGenerateVariants}
                            >
                              Regenerate Variants
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.productDesignerGhostButton}
                            onClick={onClearVariants}
                          >
                            Clear Variants
                          </button>
                        </div>

                        <div className={styles.productDesignerSuccessNote}>
                          <FontAwesomeIcon icon={faCheck} />
                          <p>
                            Each row below is one specific combination a customer can purchase. Set the
                            price and stock here, then use the edit icon for SKU, image, and status.
                          </p>
                        </div>

                        {variantsDirty && (
                          <div className={styles.productDesignerWarningNote}>
                            <FontAwesomeIcon icon={faCircleInfo} />
                            <p>
                              Your variations have changed. Regenerate variants to update the table.
                            </p>
                          </div>
                        )}

                        {variantRows.length > 0 && (
                          <div className={styles.productDesignerCompactTableWrap}>
                            <table className={styles.productDesignerCompactTable}>
                              <thead>
                                <tr>
                                  <th>Combination</th>
                                  <th>Price (₦)</th>
                                  <th>Stock</th>
                                  <th>Status</th>
                                  <th />
                                </tr>
                              </thead>
                              <tbody>
                                {variantRows.map((variant, variantIndex) => {
                                  const combinationLabel =
                                    variant?.combination ||
                                    (Array.isArray(variant?.options)
                                      ? variant.options
                                          .map(
                                            (option) => option?.display_name || option?.option_value || ""
                                          )
                                          .filter(Boolean)
                                          .join(" / ")
                                      : `Variant ${variantIndex + 1}`);
                                  const variantImageSrc = variant?.image_url
                                    ? getImageSrc(variant.image_url)
                                    : "";
                                  const isVariantEnabled = variant?.enabled !== false;
                                  const showVariantDetails =
                                    openVariantDetailIndex === variantIndex ||
                                    Boolean(getError(`variants.${variantIndex}.sku`));

                                  return (
                                    <React.Fragment key={`${combinationLabel}-${variantIndex}`}>
                                      <tr>
                                        <td>
                                          <div className={styles.productDesignerCompactVariantCell}>
                                            {Array.isArray(variant?.options) && variant.options.length > 0 ? (
                                              variant.options.map((option, optionIndex) =>
                                                renderVariationValueTag(
                                                  option?.display_name || option?.option_value || "Option",
                                                  option?.variation_name,
                                                  `${variantIndex}-${optionIndex}`
                                                )
                                              )
                                            ) : (
                                              <span className={styles.productDesignerCompactMetaTag}>
                                                {combinationLabel}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td>
                                          <div className={styles.productDesignerCompactInputWrap}>
                                            <span>₦</span>
                                            <input
                                              type="number"
                                              value={variant?.price ?? ""}
                                              onChange={(event) =>
                                                onVariantFieldChange?.(
                                                  variantIndex,
                                                  "price",
                                                  event.target.value
                                                )
                                              }
                                              min="0"
                                              step="0.01"
                                              placeholder="0"
                                            />
                                          </div>
                                          {renderFieldError(`variants.${variantIndex}.price`)}
                                        </td>
                                        <td>
                                          <input
                                            className={styles.productDesignerCompactTableInput}
                                            type="number"
                                            value={variant?.stock ?? ""}
                                            onChange={(event) =>
                                              onVariantFieldChange?.(
                                                variantIndex,
                                                "stock",
                                                event.target.value
                                              )
                                            }
                                            min="0"
                                            step="1"
                                            placeholder="0"
                                          />
                                          {renderFieldError(`variants.${variantIndex}.stock`)}
                                        </td>
                                        <td>{renderStatusPill(isVariantEnabled ? "Active" : "Disabled", isVariantEnabled)}</td>
                                        <td>
                                          <button
                                            type="button"
                                            className={styles.productDesignerTableActionButton}
                                            onClick={() =>
                                              setOpenVariantDetailIndex((currentIndex) =>
                                                currentIndex === variantIndex ? null : variantIndex
                                              )
                                            }
                                            aria-label={`Edit ${combinationLabel}`}
                                          >
                                            <FontAwesomeIcon icon={faPen} />
                                          </button>
                                        </td>
                                      </tr>

                                      {showVariantDetails && (
                                        <tr className={styles.productDesignerVariantDetailRow}>
                                          <td colSpan={5}>
                                            <div className={styles.productDesignerVariantDetailPanel}>
                                              <label className={styles.productDesignerField}>
                                                <span>SKU</span>
                                                <input
                                                  type="text"
                                                  value={variant?.sku ?? ""}
                                                  onChange={(event) =>
                                                    onVariantFieldChange?.(
                                                      variantIndex,
                                                      "sku",
                                                      event.target.value
                                                    )
                                                  }
                                                  placeholder="Variant SKU"
                                                />
                                                {renderFieldError(`variants.${variantIndex}.sku`)}
                                              </label>

                                              <label className={styles.productDesignerVariantImageField}>
                                                <span>Variant Image</span>
                                                <div className={styles.productDesignerVariantImagePreview}>
                                                  {variantImageSrc ? (
                                                    <img src={variantImageSrc} alt={combinationLabel} />
                                                  ) : (
                                                    <>
                                                      <FontAwesomeIcon icon={faImage} />
                                                      <small>Upload</small>
                                                    </>
                                                  )}
                                                </div>
                                                <input
                                                  type="file"
                                                  name={`variant_image_${variantIndex}`}
                                                  accept="image/*"
                                                  onChange={(event) =>
                                                    onVariantImageChange?.(variantIndex, event)
                                                  }
                                                />
                                              </label>

                                              <label className={styles.productDesignerVariantStatusToggle}>
                                                <span>Variant Status</span>
                                                <div className={styles.productDesignerVariantStatusLine}>
                                                  <input
                                                    type="checkbox"
                                                    checked={isVariantEnabled}
                                                    onChange={(event) =>
                                                      onVariantFieldChange?.(
                                                        variantIndex,
                                                        "enabled",
                                                        event.target.checked
                                                      )
                                                    }
                                                  />
                                                  <small>
                                                    {isVariantEnabled
                                                      ? "Customers can buy this variant."
                                                      : "This variant stays in the payload but is hidden from customers."}
                                                  </small>
                                                </div>
                                              </label>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </>
              )}
            </main>

            <aside className={styles.productDesignerAside}>
              <section className={styles.productDesignerCard}>
                <div className={styles.productDesignerCardHeader}>
                  <h3>
                    <span />
                    Product Image
                  </h3>
                </div>
                <div className={styles.productDesignerCardBody}>
                  <button
                    type="button"
                    className={styles.productDesignerUpload}
                    onClick={onProductImageClick}
                  >
                    {productImageSrc ? (
                      <img src={productImageSrc} alt="Product preview" />
                    ) : (
                      <>
                        <span>
                          <FontAwesomeIcon icon={faImage} />
                        </span>
                        <strong>Upload product photo</strong>
                        <small>JPG, PNG, WEBP · Max 5MB</small>
                      </>
                    )}
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={onProductImageChange}
                    hidden
                  />
                  {renderFieldError("product_image")}
                  {imageUrlEnabled && (
                    <label className={styles.productDesignerField}>
                      <span>Image URL</span>
                      <input
                        type="text"
                        name="image_url"
                        value={productForm?.image_url ?? ""}
                        onChange={onProductFormChange}
                        placeholder="https://example.com/product.jpg"
                      />
                      {renderFieldError("image_url")}
                    </label>
                  )}
                </div>
              </section>

              <section className={`${styles.productDesignerCard} ${styles.productDesignerCategoryCard}`}>
                <div className={styles.productDesignerCardHeader}>
                  <h3>
                    <span />
                    Category
                  </h3>
                </div>
                <div className={styles.productDesignerCardBody}>
                  <div className={styles.productDesignerCategoryGrid}>
                    {categoryChips.map((category) => (
                      <button
                        type="button"
                        key={category}
                        className={selectedCategoryValue === category ? styles.productDesignerCategoryActive : ""}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          onCategorySelect?.(category);
                        }}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  <div className={styles.productDesignerCategoryInputWrap}>
                    <input
                      value={categoryInput ?? ""}
                      onChange={onCategoryInputChange}
                      onFocus={onCategoryFocus}
                      onBlur={onCategoryBlur}
                      placeholder={categoriesLoading ? "Loading categories..." : "Or type custom category..."}
                    />
                    {showCategoryDropdown && categoryOptions.length > 0 && (
                      <div className={styles.productDesignerCategoryDropdown}>
                        {categoryOptions
                          .filter((category) =>
                            category.toLowerCase().includes((categoryInput || "").toLowerCase())
                          )
                          .slice(0, 8)
                          .map((category) => (
                            <button
                              type="button"
                              key={category}
                              onMouseDown={(event) => {
                                event.preventDefault();
                                onCategorySelect?.(category);
                              }}
                            >
                              {category}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  {renderFieldError("category")}
                </div>
              </section>

              {(canToggleVisibility || canMarkFeatured) && (
                <section className={styles.productDesignerCard}>
                  <div className={styles.productDesignerCardHeader}>
                    <h3>
                      <span />
                      Visibility
                    </h3>
                  </div>
                  <div className={styles.productDesignerCardBody}>
                    {canToggleVisibility && (
                      <label className={styles.productDesignerToggleLine}>
                        <span>
                          <strong>Publish to Store</strong>
                          <small>Customers can see and buy this product</small>
                        </span>
                        <input
                          type="checkbox"
                          name="is_published"
                          checked={!!productForm?.is_published}
                          onChange={onProductFormChange}
                        />
                      </label>
                    )}
                    {canMarkFeatured && (
                      <label className={styles.productDesignerToggleLine}>
                        <span>
                          <strong>Featured Product</strong>
                          <small>Show in featured section on home page</small>
                        </span>
                        <input
                          type="checkbox"
                          name="is_featured"
                          checked={!!productForm?.is_featured}
                          onChange={onProductFormChange}
                        />
                      </label>
                    )}
                  </div>
                </section>
              )}

              <section className={styles.productDesignerCard}>
                <div className={styles.productDesignerCardHeader}>
                  <h3>
                    <span />
                    Price Summary
                  </h3>
                </div>
                <div className={styles.productDesignerCardBody}>
                  <div className={styles.productDesignerSummaryBox}>
                    <small>
                      {isVariantMode
                        ? "Across all generated variants"
                        : hasVariations
                          ? "Across saved variation options"
                          : "Current product totals"}
                    </small>
                    <p>
                      <span>{hasVariations ? "Price range" : "Price"}</span>
                      <strong>{resolvedPriceSummaryValue}</strong>
                    </p>
                    <p>
                      <span>Total stock</span>
                      <strong>{resolvedSummaryStockValue} units</strong>
                    </p>
                    <p>
                      <span>Variant count</span>
                      <strong>{resolvedSummaryVariantCount}</strong>
                    </p>
                  </div>
                </div>
              </section>
            </aside>
          </div>

          {renderPrimaryActions(styles.productDesignerMobileActions)}
        </form>
      </div>
    </div>
  );
};

export default ProductFormDesigner;
