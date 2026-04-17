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
import ProductFormDesigner from "../../components/ProductFormDesigner";
import {
  createProduct,
  deleteProductFromStore,
  getAllProductForCollection,
  publishProductToStore,
  unpublishProductToStore,
  updateProduct,
} from "../../../slice/onlineStoreSlice";
import styles from "../../../styles.module.css";

const PRODUCTS_PER_PAGE = 20;
const DEFAULT_CATEGORIES = ["Electronics", "Clothing", "Home & Garden", "Sports"];
const shouldRenderLegacyProductModal = false;

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
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [im, setIm] = useState({
    profile: null,
    cover: null,
  });
  const [variations, setVariations] = useState([]);
  const [currentVariation, setCurrentVariation] = useState({
    variation_name: "",
    variation_type: "",
    options: [],
  });
  const [currentOption, setCurrentOption] = useState({
    value: "",
    price: "",
    stock: "",
    image_url: "",
  });
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    description: "",
    price: "",
    stock: "",
    image_url: "",
  });
  const [showVariationSection, setShowVariationSection] = useState(false);

  const profileInputRef = useRef(null);
  const optionImageRef = useRef(null);

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
    setProductForm({
      name: "",
      sku: "",
      description: "",
      price: "",
      stock: "",
      image_url: "",
    });
    setSelectedCategory("");
    setCategoryInput("");
    setShowCategoryDropdown(false);
    setIm({ profile: null, cover: null });
    setVariations([]);
    setCurrentVariation({ variation_name: "", variation_type: "", options: [] });
    setCurrentOption({ value: "", price: "", stock: "", image_url: "" });
    setShowVariationSection(false);
  };

  const openCreateProductModal = () => {
    resetCreateProductForm();
    setOpenActionMenuId(null);
    setIsEditMode(false);
    setEditingProductId(null);
    setIsCreateModalOpen(true);
  };

  const openProductDetails = (product) => {
    setOpenActionMenuId(null);
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

  const openEditProductModal = (product) => {
    setOpenActionMenuId(null);
    setSelectedProduct(null);
    setIsEditMode(true);
    setEditingProductId(product?.id || null);
    setProductForm({
      name: product?.name || "",
      sku: product?.sku || "",
      description: product?.description || "",
      price: product?.price || "",
      stock: product?.stock || "",
      image_url: product?.image_url || product?.product_image || "",
    });
    const currentCategory = product?.category || product?.Category?.name || "";
    setSelectedCategory(currentCategory);
    setCategoryInput(currentCategory);
    setIm({
      profile: product?.image_url || product?.product_image || null,
      cover: null,
    });
    if (Array.isArray(product?.variations) && product.variations.length > 0) {
      setVariations(product.variations);
      setShowVariationSection(true);
    } else {
      setVariations([]);
      setShowVariationSection(false);
    }
    setCurrentVariation({ variation_name: "", variation_type: "", options: [] });
    setCurrentOption({ value: "", price: "", stock: "", image_url: "" });
    setIsCreateModalOpen(true);
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
    reader.onloadend = () =>
      setIm((previousImages) => ({
        ...previousImages,
        [key]: reader.result,
      }));
    reader.readAsDataURL(file);
  };

  const handleProductNameChange = (event) => {
    const name = event.target.value;
    const newSKU = generateSKU(name);

    setProductForm((previousForm) => ({
      ...previousForm,
      name,
      sku: newSKU,
    }));
  };

  const handleProductFormChange = (event) => {
    const { name, value } = event.target;
    setProductForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCategoryInput(category);
    setShowCategoryDropdown(false);
  };

  const handleCategoryInputChange = (event) => {
    const value = event.target.value;
    setCategoryInput(value);
    setSelectedCategory(value);
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
    }
    window.setTimeout(() => setShowCategoryDropdown(false), 200);
  };

  const handleCategoryInputFocus = () => {
    setShowCategoryDropdown(true);
  };

  const filteredCategoryOptions = availableCategories.filter((category) =>
    category.toLowerCase().includes(categoryInput.toLowerCase())
  );

  const handleVariationNameChange = (event) => {
    setCurrentVariation((previousVariation) => ({
      ...previousVariation,
      variation_name: event.target.value,
    }));
  };

  const handleVariationTypeChange = (event) => {
    setCurrentVariation((previousVariation) => ({
      ...previousVariation,
      variation_type: event.target.value,
    }));
  };

  const handleOptionValueChange = (event) => {
    setCurrentOption((previousOption) => ({
      ...previousOption,
      value: event.target.value,
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

  const handleOptionImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCurrentOption((previousOption) => ({
        ...previousOption,
        image_url: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const addOption = () => {
    if (currentOption.value && currentOption.price !== "" && currentOption.stock !== "") {
      setCurrentVariation((previousVariation) => ({
        ...previousVariation,
        options: [...previousVariation.options, { ...currentOption }],
      }));
      setCurrentOption({ value: "", price: "", stock: "", image_url: "" });
    } else {
      window.alert("Please fill in all required fields: Option Value, Price, and Stock");
    }
  };

  const removeOption = (index) => {
    setCurrentVariation((previousVariation) => ({
      ...previousVariation,
      options: previousVariation.options.filter((_, optionIndex) => optionIndex !== index),
    }));
  };

  const addVariation = () => {
    if (
      currentVariation.variation_name &&
      currentVariation.variation_type &&
      currentVariation.options.length > 0
    ) {
      setVariations((previousVariations) => [...previousVariations, currentVariation]);
      setCurrentVariation({ variation_name: "", variation_type: "", options: [] });
    }
  };

  const removeVariation = (index) => {
    setVariations((previousVariations) =>
      previousVariations.filter((_, variationIndex) => variationIndex !== index)
    );
  };

  const toggleVariationSection = () => {
    if (!showVariationSection) {
      setProductForm((previousForm) => ({
        ...previousForm,
        price: "",
        stock: "",
      }));
    } else {
      setCurrentVariation({ variation_name: "", variation_type: "", options: [] });
      setCurrentOption({ value: "", price: "", stock: "", image_url: "" });
    }

    setShowVariationSection((previousState) => !previousState);
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

    const hasVariations = variations.length > 0;
    const priceValid = hasVariations || (productForm.price !== "" && productForm.price !== 0);
    const stockValid = hasVariations || (productForm.stock !== "" && productForm.stock !== 0);

    if (
      !productForm.name ||
      !productForm.sku ||
      !productForm.description ||
      !selectedCategory ||
      !priceValid ||
      !stockValid
    ) {
      Swal.fire({
        icon: "info",
        title: "Creating product",
        text: "All required fields must be filled. If using variations, add them before submitting.",
        confirmButtonColor: "#0273F9",
      });
      return;
    }

    const formData = new FormData();
    formData.append("name", productForm.name);
    formData.append("sku", productForm.sku);
    formData.append("description", productForm.description);
    formData.append("price", productForm.price);
    formData.append("stock", productForm.stock);
    formData.append("category", selectedCategory);

    if (im.profile && im.profile.startsWith("data:")) {
      const imageFile = base64ToFile(im.profile, `product-${productForm.sku}.jpg`);
      formData.append("product_image", imageFile);
    }

    if (variations.length > 0) {
      formData.append("variations", JSON.stringify(variations));
    }

    const resolvedImageUrl =
      productForm.image_url.trim() ||
      (im.profile && !im.profile.startsWith("data:") ? im.profile : "");

    if (resolvedImageUrl) {
      formData.append("image_url", resolvedImageUrl);
    }

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
              maxWidth: "860px",
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

            <div className="p-4">
              <div className="row g-4">
                <div className="col-md-5">
                  <div
                    style={{
                      border: "1px solid #eee",
                      borderRadius: "14px",
                      background: "#fafafa",
                      padding: "18px",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        borderRadius: "12px",
                        overflow: "hidden",
                        background: "#E5E7EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {resolveProductImage(selectedProduct) ? (
                        <img
                          src={resolveProductImage(selectedProduct)}
                          alt={resolveProductName(selectedProduct)}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faBoxOpen}
                          style={{ fontSize: "40px", color: "#9CA3AF" }}
                        />
                      )}
                    </div>

                    <div className="mt-3">
                      <span
                        className={`${styles.vendorProductStatusPill} ${
                          resolveProductStatus(selectedProduct) === "in-stock"
                            ? styles.vendorProductStatusPillSuccess
                            : styles.vendorProductStatusPillWarning
                        }`}
                      >
                        {resolveProductStatus(selectedProduct) === "in-stock"
                          ? "In Stock"
                          : "Low Stock"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="col-md-7">
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div>
                      <h4 className="mb-1" style={{ color: "#1C1917" }}>
                        {resolveProductName(selectedProduct)}
                      </h4>
                      <small style={{ color: "#78716C" }}>
                        SKU: {resolveProductSku(selectedProduct)}
                      </small>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <small className="d-block" style={{ color: "#78716C" }}>
                        Unit Price
                      </small>
                      <strong style={{ color: "#0273F9", fontSize: "20px" }}>
                        {formatCurrency(resolveProductPrice(selectedProduct))}
                      </strong>
                    </div>
                  </div>

                  <div className="row mt-4 g-3">
                    <div className="col-sm-6">
                      <div
                        style={{
                          border: "1px solid #eee",
                          borderRadius: "12px",
                          padding: "14px",
                          background: "#fff",
                        }}
                      >
                        <small className="d-block" style={{ color: "#78716C" }}>
                          Product ID
                        </small>
                        <strong>{resolveProductId(selectedProduct, 0)}</strong>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div
                        style={{
                          border: "1px solid #eee",
                          borderRadius: "12px",
                          padding: "14px",
                          background: "#fff",
                        }}
                      >
                        <small className="d-block" style={{ color: "#78716C" }}>
                          Category
                        </small>
                        <strong>{resolveProductCategory(selectedProduct)}</strong>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div
                        style={{
                          border: "1px solid #eee",
                          borderRadius: "12px",
                          padding: "14px",
                          background: "#fff",
                        }}
                      >
                        <small className="d-block" style={{ color: "#78716C" }}>
                          Stock
                        </small>
                        <strong>{resolveProductStock(selectedProduct)}</strong>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div
                        style={{
                          border: "1px solid #eee",
                          borderRadius: "12px",
                          padding: "14px",
                          background: "#fff",
                        }}
                      >
                        <small className="d-block" style={{ color: "#78716C" }}>
                          Image URL
                        </small>
                        <strong style={{ wordBreak: "break-word" }}>
                          {selectedProduct?.image_url || selectedProduct?.product_image || "N/A"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-4"
                    style={{
                      border: "1px solid #eee",
                      borderRadius: "12px",
                      padding: "16px",
                      background: "#fff",
                    }}
                  >
                    <small className="d-block mb-2" style={{ color: "#78716C" }}>
                      Description
                    </small>
                    <p className="mb-0" style={{ color: "#44403C", lineHeight: 1.7 }}>
                      {resolveProductDescription(selectedProduct)}
                    </p>
                  </div>
                </div>
              </div>

              {Array.isArray(selectedProduct?.variations) &&
                selectedProduct.variations.length > 0 && (
                  <div
                    className="mt-4"
                    style={{
                      border: "1px solid #eee",
                      borderRadius: "12px",
                      padding: "18px",
                      background: "#fff",
                    }}
                  >
                    <h6 className="mb-3">Variants</h6>
                    <div className="row g-3">
                      {selectedProduct.variations.map((variation, variationIndex) => (
                        <div
                          key={`${variation?.variation_name || "variation"}-${variationIndex}`}
                          className="col-md-6"
                        >
                          <div
                            style={{
                              border: "1px solid #eee",
                              borderRadius: "12px",
                              padding: "14px",
                              background: "#FAFAFA",
                              height: "100%",
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-start gap-2">
                              <div>
                                <strong style={{ color: "#1C1917" }}>
                                  {variation?.variation_name || "Variant"}
                                </strong>
                                <small className="d-block" style={{ color: "#78716C" }}>
                                  Type: {variation?.variation_type || "N/A"}
                                </small>
                              </div>
                              <span
                                style={{
                                  background: "#E8F4FF",
                                  color: "#0273F9",
                                  borderRadius: "999px",
                                  fontSize: "12px",
                                  padding: "4px 10px",
                                }}
                              >
                                {Array.isArray(variation?.options)
                                  ? `${variation.options.length} option(s)`
                                  : "0 option"}
                              </span>
                            </div>

                            {Array.isArray(variation?.options) && variation.options.length > 0 ? (
                              <div className="mt-3 d-flex flex-column gap-2">
                                {variation.options.map((option, optionIndex) => (
                                  <div
                                    key={`${option?.value || "option"}-${optionIndex}`}
                                    style={{
                                      border: "1px solid #e7e5e4",
                                      borderRadius: "10px",
                                      padding: "10px 12px",
                                      background: "#fff",
                                    }}
                                  >
                                    <div className="d-flex justify-content-between gap-3">
                                      <strong>{option?.value || "Option"}</strong>
                                      <span style={{ color: "#0273F9" }}>
                                        {formatCurrency(Number(option?.price || 0))}
                                      </span>
                                    </div>
                                    <small style={{ color: "#78716C" }}>
                                      Stock: {option?.stock ?? 0}
                                    </small>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <small className="d-block mt-3" style={{ color: "#78716C" }}>
                                No options available.
                              </small>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
          showVariationSection={showVariationSection}
          onToggleVariationSection={toggleVariationSection}
          variations={variations}
          currentVariation={currentVariation}
          currentOption={currentOption}
          onVariationNameChange={handleVariationNameChange}
          onVariationTypeChange={handleVariationTypeChange}
          onOptionValueChange={handleOptionValueChange}
          onOptionPriceChange={handleOptionPriceChange}
          onOptionStockChange={handleOptionStockChange}
          onOptionImageChange={handleOptionImageChange}
          onAddOption={addOption}
          onRemoveOption={removeOption}
          onAddVariation={addVariation}
          onRemoveVariation={removeVariation}
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
