import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCircleInfo,
  faGripVertical,
  faImage,
  faPen,
  faPlus,
  faRotateRight,
  faTrashCan,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import styles from "../../styles.module.css";

const QUICK_OPTIONS = {
  color: ["Red", "Blue", "White", "Green", "Grey", "Navy", "Pink"],
  colour: ["Red", "Blue", "White", "Green", "Grey", "Navy", "Pink"],
  size: ["XS", "S", "M", "L", "XL", "XXL", "36"],
  material: ["Cotton", "Leather", "Wool", "Silk", "Denim"],
};

const formatNumber = (value) => {
  const amount = Number(value) || 0;
  return amount.toLocaleString("en-NG");
};

const normalizeVariation = (variation = {}) => ({
  variation_name: variation?.variation_name || variation?.name || "",
  variation_type: variation?.variation_type || variation?.type || "",
  options: Array.isArray(variation?.options) ? variation.options : [],
});

const getVariationLabel = (variation = {}, fallbackIndex = 0) =>
  variation?.variation_name ||
  variation?.variation_type ||
  `Variation ${fallbackIndex + 1}`;

const getVariantCombinations = (variationList = []) => {
  const validVariations = variationList
    .map(normalizeVariation)
    .filter((variation) => variation.options.length > 0);

  if (!validVariations.length) return [];

  return validVariations.reduce((rows, variation) => {
    if (rows.length === 0) {
      return variation.options.map((option) => ({
        labels: [option.value || option.option_value || "Option"],
        price: Number(option.price) || 0,
        stock: Number(option.stock) || 0,
      }));
    }

    return rows.flatMap((row) =>
      variation.options.map((option) => ({
        labels: [...row.labels, option.value || option.option_value || "Option"],
        price: Math.max(row.price, Number(option.price) || 0),
        stock: Math.min(row.stock, Number(option.stock) || 0),
      }))
    );
  }, []);
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
  showVariationSection = false,
  onToggleVariationSection,
  variations = [],
  currentVariation,
  currentOption,
  onVariationNameChange,
  onVariationTypeChange,
  onVariationRequiredChange,
  onOptionValueChange,
  onOptionPriceChange,
  onOptionStockChange,
  onOptionImageChange,
  onQuickOption,
  onAddOption,
  onRemoveOption,
  onAddVariation,
  onRemoveVariation,
  canToggleVisibility = false,
  canMarkFeatured = false,
}) => {
  if (!isOpen) return null;

  const normalizedVariations = variations.map(normalizeVariation);
  const variantCombinations = getVariantCombinations(normalizedVariations);
  const selectedCategoryValue = selectedCategory || categoryInput;
  const categoryChips = categoryOptions.slice(0, 6);
  const quickKey = (currentVariation?.variation_type || currentVariation?.variation_name || "")
    .trim()
    .toLowerCase();
  const quickOptions = QUICK_OPTIONS[quickKey] || QUICK_OPTIONS[quickKey.replace(/\s+/g, "")] || [];
  const hasVariations = normalizedVariations.length > 0;
  const totalVariantStock = variantCombinations.reduce(
    (total, variant) => total + (Number(variant.stock) || 0),
    0
  );
  const variantPrices = variantCombinations
    .map((variant) => Number(variant.price) || Number(productForm?.price) || 0)
    .filter((price) => price > 0);
  const minVariantPrice = variantPrices.length ? Math.min(...variantPrices) : Number(productForm?.price) || 0;

  const handleQuickOptionClick = (value) => {
    if (onQuickOption) {
      onQuickOption(value);
      return;
    }

    if (onOptionValueChange) {
      onOptionValueChange({ target: { value } });
    }
  };

  const renderTextInput = ({ label, name, value, onChange, placeholder, required, readOnly, type = "text" }) => (
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
      />
    </label>
  );

  return (
    <div className={styles.productDesignerOverlay} onClick={onClose}>
      <div className={styles.productDesignerShell} onClick={(event) => event.stopPropagation()}>
        <form className={styles.productDesignerForm} onSubmit={onSubmit}>
          <div className={styles.productDesignerTopbar}>
            <div>
              <div className={styles.productDesignerBreadcrumb}>
                <span>Products</span>
                <span>/</span>
                <span>{title}</span>
              </div>
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>

            <div className={styles.productDesignerActions}>
              <button type="submit" className={styles.productDesignerGhostButton}>
                Save Draft
              </button>
              <button type="submit" className={styles.productDesignerPrimaryButton} disabled={isSubmitting}>
                {isSubmitting ? (
                  loadingLabel || (isEditMode ? "Updating..." : "Publishing...")
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} />
                    {submitLabel || (isEditMode ? "Update Product" : "Publish Product")}
                  </>
                )}
              </button>
              <button type="button" className={styles.productDesignerCloseButton} onClick={onClose}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
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
                  {renderTextInput({
                    label: "Product Name",
                    value: productForm?.name,
                    onChange: onProductNameChange,
                    placeholder: "e.g. Premium Leather Sneakers",
                    required: true,
                  })}

                  <label className={styles.productDesignerField}>
                    <span>Description</span>
                    <textarea
                      name="description"
                      value={productForm?.description ?? ""}
                      onChange={onProductFormChange}
                      placeholder="Describe your product, materials, features, care instructions..."
                      rows={4}
                    />
                  </label>

                  <div className={styles.productDesignerTwoCols}>
                    {renderTextInput({
                      label: "SKU",
                      name: "sku",
                      value: productForm?.sku,
                      onChange: onProductFormChange,
                      placeholder: "e.g. SNK-001",
                      readOnly: true,
                    })}
                    {renderTextInput({
                      label: "Barcode",
                      name: "barcode",
                      value: productForm?.barcode,
                      onChange: onProductFormChange,
                      placeholder: "e.g. 8901234567890",
                    })}
                  </div>

                  {!hasVariations && !showVariationSection && (
                    <div className={styles.productDesignerTwoCols}>
                      {renderTextInput({
                        label: "Price",
                        name: "price",
                        value: productForm?.price,
                        onChange: onProductFormChange,
                        placeholder: "0.00",
                        required: true,
                        type: "number",
                      })}
                      {renderTextInput({
                        label: "Stock",
                        name: "stock",
                        value: productForm?.stock,
                        onChange: onProductFormChange,
                        placeholder: "0",
                        required: true,
                        type: "number",
                      })}
                    </div>
                  )}
                </div>
              </section>

              {variationsEnabled && (
                <>
                  <div className={styles.productDesignerNotice}>
                    <FontAwesomeIcon icon={faCircleInfo} />
                    <p>
                      <strong>Price & Stock are managed per variation option.</strong> Each colour, size,
                      or custom option below can have its own price and stock. Remove all variations to set
                      a single price.
                    </p>
                  </div>

                  <section className={styles.productDesignerCard}>
                    <div className={styles.productDesignerCardHeader}>
                      <h3>
                        <span />
                        Variations
                      </h3>
                      <small>{normalizedVariations.reduce((sum, variation) => sum + variation.options.length, 0)} options</small>
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
                          image. Variants rebuild automatically as options change.
                        </p>
                      </div>

                      {showVariationSection && (
                        <div className={styles.productDesignerVariationEditor}>
                          <div className={styles.productDesignerVariationHeader}>
                            <div>
                              <FontAwesomeIcon icon={faGripVertical} />
                              <strong>{currentVariation?.variation_name || "New variation"}</strong>
                            </div>
                            <small>{currentVariation?.options?.length || 0} options</small>
                          </div>

                          <div className={styles.productDesignerTwoCols}>
                            <label className={styles.productDesignerField}>
                              <span>Variation Type</span>
                              <select
                                value={currentVariation?.variation_type ?? ""}
                                onChange={onVariationTypeChange}
                              >
                                <option value="">Select type</option>
                                <option value="colour">Colour</option>
                                <option value="size">Size</option>
                                <option value="material">Material</option>
                                <option value="custom">Custom</option>
                              </select>
                            </label>

                            {renderTextInput({
                              label: "Display Label",
                              value: currentVariation?.variation_name,
                              onChange: onVariationNameChange,
                              placeholder: "Colour",
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

                          <div className={styles.productDesignerOptionTable}>
                            <div className={styles.productDesignerOptionHead}>
                              <span>Img</span>
                              <span>Option Value</span>
                              <span>Price (₦)</span>
                              <span>Stock</span>
                              <span />
                            </div>

                            {(currentVariation?.options || []).map((option, index) => (
                              <div className={styles.productDesignerOptionRow} key={`${option.value}-${index}`}>
                                <div className={styles.productDesignerOptionImage}>
                                  {option.image_url ? <img src={option.image_url} alt="" /> : <FontAwesomeIcon icon={faImage} />}
                                </div>
                                <input value={option.value ?? ""} readOnly />
                                <input value={option.price ?? ""} readOnly />
                                <input value={option.stock ?? ""} readOnly />
                                <button type="button" onClick={() => onRemoveOption?.(index)}>
                                  <FontAwesomeIcon icon={faXmark} />
                                </button>
                              </div>
                            ))}

                            <div className={styles.productDesignerOptionRow}>
                              <button
                                type="button"
                                className={styles.productDesignerOptionImage}
                                onClick={() => optionImageRef?.current?.click()}
                              >
                                {currentOption?.image_url ? (
                                  <img src={currentOption.image_url} alt="" />
                                ) : (
                                  <FontAwesomeIcon icon={faImage} />
                                )}
                              </button>
                              <input
                                value={currentOption?.value ?? ""}
                                onChange={onOptionValueChange}
                                placeholder="Black"
                              />
                              <input
                                type="number"
                                value={currentOption?.price ?? ""}
                                onChange={onOptionPriceChange}
                                placeholder="45000"
                              />
                              <input
                                type="number"
                                value={currentOption?.stock ?? ""}
                                onChange={onOptionStockChange}
                                placeholder="10"
                              />
                              <button type="button" onClick={onAddOption}>
                                <FontAwesomeIcon icon={faPlus} />
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
                            className={styles.productDesignerDashedButton}
                            onClick={onAddOption}
                          >
                            <FontAwesomeIcon icon={faPlus} />
                            Add option
                          </button>

                          <button
                            type="button"
                            className={styles.productDesignerPrimarySmall}
                            onClick={onAddVariation}
                          >
                            Save variation
                          </button>
                        </div>
                      )}

                      {normalizedVariations.map((variation, index) => (
                        <div className={styles.productDesignerSavedVariation} key={`${getVariationLabel(variation, index)}-${index}`}>
                          <div className={styles.productDesignerSavedVariationTop}>
                            <div>
                              <FontAwesomeIcon icon={faGripVertical} />
                              <span>{variation.variation_type || `Variation ${index + 1}`}</span>
                              <strong>{getVariationLabel(variation, index)}</strong>
                            </div>
                            <div>
                              <small>{variation.options.length} options</small>
                              <button type="button" onClick={() => onRemoveVariation?.(index)}>
                                <FontAwesomeIcon icon={faTrashCan} />
                              </button>
                            </div>
                          </div>

                          <div className={styles.productDesignerSavedOptions}>
                            {variation.options.map((option, optionIndex) => (
                              <span key={`${option.value}-${optionIndex}`}>{option.value}</span>
                            ))}
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        className={styles.productDesignerDashedButton}
                        onClick={onToggleVariationSection}
                      >
                        <FontAwesomeIcon icon={faPlus} />
                        {showVariationSection ? "Hide variation editor" : "Add another variation type"}
                      </button>
                    </div>
                  </section>

                  {variantCombinations.length > 0 && (
                    <section className={styles.productDesignerCard}>
                      <div className={styles.productDesignerCardHeader}>
                        <h3>
                          <span />
                          Generated Variants
                        </h3>
                        <button type="button">
                          <FontAwesomeIcon icon={faRotateRight} />
                          Regenerate
                        </button>
                      </div>

                      <div className={styles.productDesignerCardBody}>
                        <div className={styles.productDesignerSuccessNote}>
                          <FontAwesomeIcon icon={faCheck} />
                          <p>
                            Each row below is one specific combination a customer can purchase. Set the
                            price and stock for each option before publishing.
                          </p>
                        </div>

                        <div className={styles.productDesignerVariantTable}>
                          <div className={styles.productDesignerVariantHead}>
                            <span>Variant (Combination)</span>
                            <span>Price (₦)</span>
                            <span>Stock</span>
                            <span>Status</span>
                            <span />
                          </div>
                          {variantCombinations.map((variant, index) => (
                            <div className={styles.productDesignerVariantRow} key={`${variant.labels.join("-")}-${index}`}>
                              <div>
                                {variant.labels.map((label, labelIndex) => (
                                  <span key={`${label}-${labelIndex}`}>{label}</span>
                                ))}
                              </div>
                              <input value={formatNumber(variant.price || productForm?.price)} readOnly />
                              <input value={variant.stock || productForm?.stock || 0} readOnly />
                              <small>Active</small>
                              <button type="button">
                                <FontAwesomeIcon icon={faPen} />
                              </button>
                            </div>
                          ))}
                        </div>
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
                    <small>Across all variants</small>
                    <p>
                      <span>Price range</span>
                      <strong>₦{formatNumber(minVariantPrice)}</strong>
                    </p>
                    <p>
                      <span>Total stock</span>
                      <strong>{hasVariations ? totalVariantStock : productForm?.stock || 0} units</strong>
                    </p>
                    <p>
                      <span>Variant count</span>
                      <strong>{variantCombinations.length || 1}</strong>
                    </p>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormDesigner;
