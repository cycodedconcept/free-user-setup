import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendDown,
  faArrowTrendUp,
  faBagShopping,
  faBoxOpen,
  faCaretDown,
  faCartShopping,
  faChevronDown,
  faCircleExclamation,
  faMagnifyingGlass,
  faPlus,
  faRotateRight,
  faUpload,
  faWallet,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import Button from "../../../components/ui/Button";
import Pagination from "../../../components/Pagination";
import ProductFormDesigner from "../../components/ProductFormDesigner";
import { createProduct } from "../../../slice/onlineStoreSlice";
import { getInventoryCategories, getInventoryProducts } from "../../../slice/inventory";
import styles from "../../../styles.module.css";

const INVENTORY_PAGE_LIMIT = 50;
const DEFAULT_FALLBACK_CATEGORIES = ["Electronics", "Clothing", "Home & Garden", "Sports"];
const shouldRenderLegacyProductModal = false;

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const resolveProductStock = (product) => {
  const directStock = Number(product?.stock);

  if (Number.isFinite(directStock) && directStock >= 0) {
    return directStock;
  }

  const variationStock = Array.isArray(product?.variations)
    ? product.variations.reduce((variationTotal, variation) => {
        const optionTotal = Array.isArray(variation?.options)
          ? variation.options.reduce((sum, option) => {
              const optionStock = Number(option?.stock);
              return sum + (Number.isFinite(optionStock) ? optionStock : 0);
            }, 0)
          : 0;

        return variationTotal + optionTotal;
      }, 0)
    : 0;

  return variationStock;
};

const resolveProductPrice = (product) => {
  const directPrice = Number(product?.price ?? product?.cost ?? 0);
  return Number.isFinite(directPrice) ? directPrice : 0;
};

const getStatusMeta = (product, stock) => {
  const status = product?.stock_status;

  if (status === "out_of_stock" || stock <= 0) {
    return {
      label: "Out of Stock",
      shortLabel: "O",
      color: "#ef4444",
      width: 12,
    };
  }

  if (status === "low_stock") {
    return {
      label: "Low Stock",
      shortLabel: "L",
      color: "#f59e0b",
      width: Math.min(45, Math.max(18, stock * 2)),
    };
  }

  return {
    label: "In Stock",
    shortLabel: "H",
    color: "#22c55e",
    width: Math.min(100, Math.max(34, stock)),
  };
};

const resolveSupplier = (product) =>
  product?.supplier || product?.vendor || product?.tenant?.name || "-";

const getVariantRows = (product) => {
  if (!Array.isArray(product?.variations)) {
    return [];
  }

  return product.variations.flatMap((variation) =>
    Array.isArray(variation?.options)
      ? variation.options.map((option, index) => ({
          id: option?.id || `${variation?.id || variation?.variation_name}-${index}`,
          name: option?.display_name || option?.value || `Option ${index + 1}`,
          sku: option?.sku || product?.sku || "-",
          units: Number.isFinite(Number(option?.stock)) ? Number(option.stock) : 0,
        }))
      : []
  );
};

const iconWrapStyle = {
  width: "42px",
  height: "42px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
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

const Product = () => {
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const storeId =
    typeof window !== "undefined"
      ? window.localStorage.getItem("itemId") || "7"
      : "7";
  const collectionId =
    typeof window !== "undefined"
      ? Number(window.localStorage.getItem("inventoryCollectionId") || 5)
      : 5;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    description: "",
    price: "",
    stock: "",
    image_url: "",
    is_published: false,
    is_featured: false,
  });
  const [productImage, setProductImage] = useState(null);
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
  const [showVariationSection, setShowVariationSection] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  const profileInputRef = useRef(null);
  const optionImageRef = useRef(null);

  const {
    loading,
    error,
    inventoryProducts,
    categoriesLoading,
    inventoryCategories,
  } = useSelector((state) => state.inventory);
  const storeLoading = useSelector((state) => state.store.loading);
  const inventoryRows = inventoryProducts?.data || [];
  const inventoryPagination = inventoryProducts?.pagination || {};

  useEffect(() => {
    if (!token) {
      return;
    }

    dispatch(
      getInventoryProducts({
        token,
        page: currentPage,
        search: deferredSearchQuery,
        category: categoryFilter,
        isActive: true,
        isPublished: true,
        stock_status: statusFilter,
        // collection_id: collectionId,
      })
    );
  }, [categoryFilter, collectionId, currentPage, deferredSearchQuery, dispatch, statusFilter, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    dispatch(getInventoryCategories({ token }));
  }, [dispatch, token]);

  useEffect(() => {
    if (typeof document === "undefined" || (!selectedProduct && !isCreateModalOpen)) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isCreateModalOpen, selectedProduct]);

  const products = useMemo(
    () =>
      inventoryRows.map((product) => {
        const stock = resolveProductStock(product);
        const price = resolveProductPrice(product);

        return {
          id: String(product?.id || ""),
          name: product?.name || "Untitled product",
          sku: product?.sku || "-",
          category: product?.category || "General",
          supplier: resolveSupplier(product),
          stock,
          price,
          description: product?.description || "No description available.",
          lowStockThreshold:
            Number.isFinite(Number(product?.low_stock_threshold))
              ? Number(product.low_stock_threshold)
              : 0,
          image_url: product?.image_url || "",
          variants: getVariantRows(product),
          stockMeta: getStatusMeta(product, stock),
          raw: product,
        };
      }),
    [inventoryRows]
  );

  const totalProductsCount =
    inventoryPagination?.total_items ||
    inventoryProducts?.total ||
    products.length;
  const lowStockItems = products.filter(
    (product) => product.stockMeta.label !== "In Stock"
  ).length;
  const totalItemsInStock = products.reduce((sum, product) => sum + product.stock, 0);
  const inventoryValue = products.reduce(
    (sum, product) => sum + product.stock * product.price,
    0
  );
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];
  const categoryOptions = [
    ...new Set([
      ...DEFAULT_FALLBACK_CATEGORIES,
      ...categories,
      ...(inventoryCategories || []).map((category) => category?.name).filter(Boolean),
    ]),
  ];
  const filteredCategoryOptions = categoryOptions.filter((category) =>
    category.toLowerCase().includes(categoryInput.toLowerCase())
  );

  const stats = [
    {
      title: "Total Products",
      value: String(totalProductsCount),
      trend: `${products.length} on this page`,
      trendPositive: true,
      icon: faBagShopping,
      iconColor: "#0d7cff",
      iconBackground: "#eaf3ff",
    },
    {
      title: "Low Stock Items",
      value: String(lowStockItems),
      trend: "Needs attention",
      trendPositive: false,
      icon: faCircleExclamation,
      iconColor: "#ef4444",
      iconBackground: "#feeceb",
    },
    {
      title: "Total Items in Stock",
      value: String(totalItemsInStock),
      trend: "Across current results",
      trendPositive: true,
      icon: faCartShopping,
      iconColor: "#a855f7",
      iconBackground: "#f6e8ff",
    },
    {
      title: "Inventory Value",
      value: formatCurrency(inventoryValue),
      trend: "Based on available prices",
      trendPositive: true,
      icon: faWallet,
      iconColor: "#16a34a",
      iconBackground: "#e8f8e8",
    },
  ];

  const exportProducts = () => {
    if (typeof window === "undefined" || products.length === 0) {
      return;
    }

    const rows = products.map((product) =>
      [
        product.id,
        product.name,
        product.sku,
        product.category,
        product.supplier,
        product.stock,
        product.stockMeta.label,
      ].join(",")
    );

    const csv = [
      "ID,Product Name,SKU,Category,Supplier,Stock,Status",
      ...rows,
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.setAttribute("download", "inventory-products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  };

  const refreshInventory = () => {
    if (!token) {
      return Promise.resolve();
    }

    return dispatch(
      getInventoryProducts({
        token,
        page: currentPage,
        search: deferredSearchQuery,
        category: categoryFilter,
        isActive: true,
        isPublished: true,
        stock_status: statusFilter,
        collection_id: collectionId,
      })
    );
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
      is_published: false,
      is_featured: false,
    });
    setProductImage(null);
    setCategoryInput("");
    setSelectedCategory("");
    setShowCategoryDropdown(false);
    setVariations([]);
    setCurrentVariation({ variation_name: "", variation_type: "", options: [] });
    setCurrentOption({ value: "", price: "", stock: "", image_url: "" });
    setShowVariationSection(false);
  };

  const openCreateProductModal = () => {
    resetCreateProductForm();
    setIsCreateModalOpen(true);
  };

  const closeCreateProductModal = () => {
    setIsCreateModalOpen(false);
    resetCreateProductForm();
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
  };

  const handleProductNameChange = (event) => {
    const name = event.target.value;
    const nextSku = generateSKU(name);

    setProductForm((previousForm) => ({
      ...previousForm,
      name,
      sku: nextSku,
    }));
  };

  const handleProductFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProductForm((previousForm) => ({
      ...previousForm,
      [name]: type === "checkbox" ? checked : value,
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

  const handleCategoryInputBlur = () => {
    const trimmedCategory = categoryInput.trim();
    if (trimmedCategory) {
      setCategoryInput(trimmedCategory);
      setSelectedCategory(trimmedCategory);
    }

    window.setTimeout(() => setShowCategoryDropdown(false), 200);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProductImage({
        file,
        preview: reader.result,
      });
    };
    reader.readAsDataURL(file);
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

  const handleVariationNameChange = (event) => {
    setCurrentVariation((previousVariation) => ({
      ...previousVariation,
      variation_name: event.target.value,
    }));
  };

  const handleVariationTypeChange = (event) => {
    const variationType = event.target.value;
    setCurrentVariation((previousVariation) => ({
      ...previousVariation,
      variation_type: variationType,
      variation_name:
        previousVariation.variation_name || (variationType === "custom" ? "" : variationType),
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
      price: event.target.value === "" ? "" : Number(event.target.value),
    }));
  };

  const handleOptionStockChange = (event) => {
    setCurrentOption((previousOption) => ({
      ...previousOption,
      stock: event.target.value === "" ? "" : Number(event.target.value),
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
    if (!currentOption.value || currentOption.price === "" || currentOption.stock === "") {
      Swal.fire({
        icon: "info",
        title: "Variation option",
        text: "Fill in option value, price, and stock before adding the option.",
        confirmButtonColor: "#0273F9",
      });
      return;
    }

    setCurrentVariation((previousVariation) => ({
      ...previousVariation,
      options: [...previousVariation.options, { ...currentOption }],
    }));
    setCurrentOption({ value: "", price: "", stock: "", image_url: "" });
  };

  const removeOption = (index) => {
    setCurrentVariation((previousVariation) => ({
      ...previousVariation,
      options: previousVariation.options.filter((_, optionIndex) => optionIndex !== index),
    }));
  };

  const addVariation = () => {
    if (
      !currentVariation.variation_name ||
      !currentVariation.variation_type ||
      currentVariation.options.length === 0
    ) {
      Swal.fire({
        icon: "info",
        title: "Variation",
        text: "Add a variation type, display label, and at least one option value first.",
        confirmButtonColor: "#0273F9",
      });
      return;
    }

    setVariations((previousVariations) => [...previousVariations, currentVariation]);
    setCurrentVariation({ variation_name: "", variation_type: "", options: [] });
  };

  const removeVariation = (index) => {
    setVariations((previousVariations) =>
      previousVariations.filter((_, variationIndex) => variationIndex !== index)
    );
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    const trimmedCategory = selectedCategory.trim() || categoryInput.trim();
    const hasVariations = variations.length > 0;
    const priceValid = hasVariations || productForm.price !== "";
    const stockValid = hasVariations || productForm.stock !== "";

    if (
      !productForm.name.trim() ||
      !productForm.sku.trim() ||
      !productForm.description.trim() ||
      !trimmedCategory ||
      !priceValid ||
      !stockValid
    ) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Fill in product name, description, category, price, and stock. If using variations, add the variation options before publishing.",
        confirmButtonColor: "#0273F9",
      });
      return;
    }

    if (!productImage?.file && !productForm.image_url.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Product Image Required",
        text: "Upload a product image or provide an image URL before creating the product.",
        confirmButtonColor: "#0273F9",
      });
      return;
    }

    const formData = new FormData();
    formData.append("name", productForm.name.trim());
    formData.append("sku", productForm.sku.trim());
    formData.append("description", productForm.description.trim());
    formData.append("price", productForm.price);
    formData.append("stock", productForm.stock);
    formData.append("category", trimmedCategory);
    formData.append("is_published", productForm.is_published ? 1 : 0);
    formData.append("is_featured", productForm.is_featured ? 1 : 0);

    if (productImage?.file) {
      formData.append("product_image", productImage.file);
    }

    if (productForm.image_url.trim()) {
      formData.append("image_url", productForm.image_url.trim());
    }

    if (variations.length > 0) {
      formData.append("variations", JSON.stringify(variations));
    }

    try {
      Swal.fire({
        title: "Creating Product...",
        text: "Please wait while we add the product to your inventory.",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await dispatch(
        createProduct({ formData, token, id: storeId })
      ).unwrap();

      closeCreateProductModal();
      await refreshInventory();
      await dispatch(getInventoryCategories({ token }));

      Swal.fire({
        icon: response?.success === true ? "success" : "info",
        title: response?.success === true ? "Product Created" : "Request Completed",
        text: response?.message || "Product has been added successfully.",
        confirmButtonColor: "#0273F9",
      });
    } catch (submitError) {
      Swal.fire({
        icon: "error",
        title: "Unable to Create Product",
        text: resolveApiErrorMessage(submitError),
        confirmButtonColor: "#0273F9",
      });
    }
  };

  return (
    <div style={{ color: "var(--app-text)" }}>
      <div
        className="d-flex flex-wrap justify-content-between align-items-start"
        style={{ gap: "16px", marginBottom: "24px" }}
      >
        <div>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: 700,
              marginBottom: "6px",
              color: "var(--app-text)",
            }}
          >
            Available Products
          </h2>
          <p
            style={{
              margin: 0,
              color: "var(--app-text-muted)",
              fontSize: "15px",
            }}
          >
            Overview of your inventory
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center" style={{ gap: "12px" }}>
          <Button
            unstyled
            onClick={refreshInventory}
            disabled={loading || !token}
            style={{
              border: "1px solid var(--app-border)",
              borderRadius: "10px",
              background: "var(--app-surface)",
              color: "var(--app-text)",
              padding: "14px 18px",
              fontWeight: 600,
              fontSize: "15px",
              opacity: loading || !token ? 0.6 : 1,
            }}
          >
            <FontAwesomeIcon icon={faRotateRight} style={{ marginRight: "10px" }} />
            Refresh
          </Button>

          <Button
            unstyled
            onClick={openCreateProductModal}
            disabled={!token}
            style={{
              border: "none",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0d7cff 0%, #0273f9 100%)",
              color: "#ffffff",
              padding: "14px 18px",
              fontWeight: 600,
              fontSize: "15px",
              boxShadow: "0 12px 24px rgba(2, 115, 249, 0.18)",
              opacity: !token ? 0.6 : 1,
            }}
          >
            <FontAwesomeIcon icon={faPlus} style={{ marginRight: "10px" }} />
            Add New Product
          </Button>
        </div>
      </div>

      {!token && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            borderRadius: "10px",
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#b91c1c",
          }}
        >
          Inventory data requires an authenticated vendor session.
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            borderRadius: "10px",
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "28px",
        }}
      >
        {stats.map((stat) => (
          <article
            key={stat.title}
            style={{
              background: "var(--app-surface)",
              border: "1px solid var(--app-border)",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "var(--app-shadow-soft)",
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "var(--app-text)",
                    fontSize: "16px",
                    fontWeight: 500,
                  }}
                >
                  {stat.title}
                </p>
                <h3
                  style={{
                    margin: "14px 0 8px",
                    color: "var(--app-text)",
                    fontSize: "20px",
                    fontWeight: 700,
                    maxWidth: "150px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={stat.value}
                >
                  {stat.value}
                </h3>
              </div>

              <span
                style={{
                  ...iconWrapStyle,
                  color: stat.iconColor,
                  background: stat.iconBackground,
                }}
              >
                <FontAwesomeIcon icon={stat.icon} />
              </span>
            </div>

            <p
              style={{
                margin: 0,
                color: stat.trendPositive ? "#22c55e" : "#ef4444",
                fontSize: "15px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FontAwesomeIcon
                icon={stat.trendPositive ? faArrowTrendUp : faArrowTrendDown}
              />
              <span>{stat.trend}</span>
            </p>
          </article>
        ))}
      </div>

      <section
        style={{
          background: "var(--app-surface)",
          border: "1px solid var(--app-border)",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "var(--app-shadow-soft)",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid var(--app-border)",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "var(--app-text)",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            Product List
          </h3>
        </div>

        <div style={{ padding: "16px 16px 0" }}>
          <div
            className="d-flex flex-wrap justify-content-between align-items-center"
            style={{ gap: "14px", marginBottom: "16px" }}
          >
            <div style={{ position: "relative", flex: "1 1 280px", maxWidth: "320px" }}>
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                style={{
                  position: "absolute",
                  left: "15px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--app-text-muted)",
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search for product"
                aria-label="Search for product"
                style={{
                  width: "100%",
                  height: "44px",
                  borderRadius: "10px",
                  border: "1px solid var(--app-border)",
                  background: "var(--app-surface)",
                  color: "var(--app-text)",
                  padding: "0 14px 0 42px",
                  outline: "none",
                }}
              />
            </div>

            <div className="d-flex flex-wrap align-items-center" style={{ gap: "10px" }}>
              <div style={{ position: "relative" }}>
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by status"
                  style={{
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    minWidth: "144px",
                    height: "44px",
                    borderRadius: "10px",
                    border: "1px solid var(--app-border)",
                    background: "var(--app-surface)",
                    color: "var(--app-text-muted)",
                    padding: "0 40px 0 14px",
                    outline: "none",
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--app-text-muted)",
                    pointerEvents: "none",
                  }}
                />
              </div>

              <div style={{ position: "relative" }}>
                <select
                  value={categoryFilter}
                  onChange={(event) => {
                    setCategoryFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by category"
                  style={{
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    minWidth: "144px",
                    height: "44px",
                    borderRadius: "10px",
                    border: "1px solid var(--app-border)",
                    background: "var(--app-surface)",
                    color: "var(--app-text-muted)",
                    padding: "0 40px 0 14px",
                    outline: "none",
                  }}
                >
                  <option value="">Category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--app-text-muted)",
                    pointerEvents: "none",
                  }}
                />
              </div>

              <Button
                unstyled
                onClick={exportProducts}
                disabled={products.length === 0}
                style={{
                  height: "44px",
                  borderRadius: "10px",
                  border: "1px solid var(--app-border)",
                  background: "var(--app-surface)",
                  color: "var(--app-text)",
                  padding: "0 18px",
                  fontWeight: 600,
                  opacity: products.length === 0 ? 0.6 : 1,
                }}
              >
                Export
              </Button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: "980px",
                borderCollapse: "separate",
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr>
                  {["#ID", "Product Name", "SKU", "Category", "Supplier", "Stock Level"].map(
                    (header, index) => (
                      <th
                        key={header}
                        style={{
                          textAlign: "left",
                          padding: "16px 10px",
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "var(--app-text)",
                          background: "var(--app-surface-2)",
                          borderTop: "1px solid var(--app-border)",
                          borderBottom: "1px solid var(--app-border)",
                          borderLeft:
                            index === 0 ? "1px solid var(--app-border)" : "none",
                          borderRight:
                            index === 5
                              ? "1px solid var(--app-border)"
                              : "1px solid var(--app-border)",
                        }}
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        padding: "40px 20px",
                        textAlign: "center",
                        color: "var(--app-text-muted)",
                        borderBottom: "1px solid var(--app-border)",
                      }}
                    >
                      Loading inventory products...
                    </td>
                  </tr>
                ) : products.length > 0 ? (
                  products.map((product) => (
                    <tr
                      key={`${product.id}-${product.sku}`}
                      onClick={() => setSelectedProduct(product)}
                      style={{ cursor: "pointer" }}
                    >
                      <td
                        style={{
                          padding: "14px 10px",
                          borderBottom: "1px solid var(--app-border)",
                          color: "var(--app-text-muted)",
                          fontSize: "15px",
                        }}
                      >
                        {product.id}
                      </td>
                      <td
                        style={{
                          padding: "14px 10px",
                          borderBottom: "1px solid var(--app-border)",
                          color: "var(--app-text)",
                          fontSize: "15px",
                        }}
                      >
                        <div className="d-flex align-items-center" style={{ gap: "10px" }}>
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "4px",
                                objectFit: "cover",
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              aria-hidden="true"
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "4px",
                                background:
                                  "linear-gradient(135deg, #d4d4d8 0%, #e4e4e7 100%)",
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <span>{product.name}</span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "14px 10px",
                          borderBottom: "1px solid var(--app-border)",
                          color: "var(--app-text)",
                          fontSize: "15px",
                        }}
                      >
                        {product.sku}
                      </td>
                      <td
                        style={{
                          padding: "14px 10px",
                          borderBottom: "1px solid var(--app-border)",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "12px",
                            color: "#0d7cff",
                            background: "#eaf3ff",
                          }}
                        >
                          {product.category}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "14px 10px",
                          borderBottom: "1px solid var(--app-border)",
                          color: "var(--app-text)",
                          fontSize: "15px",
                        }}
                      >
                        {product.supplier}
                      </td>
                      <td
                        style={{
                          padding: "14px 10px",
                          borderBottom: "1px solid var(--app-border)",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              color: "var(--app-text)",
                              fontSize: "15px",
                              marginBottom: "8px",
                            }}
                          >
                            {product.stock} unit - {product.stockMeta.shortLabel}
                          </div>
                          <div
                            style={{
                              width: "84px",
                              height: "4px",
                              borderRadius: "999px",
                              background: "var(--app-surface-3)",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${product.stockMeta.width}%`,
                                height: "100%",
                                background: product.stockMeta.color,
                                borderRadius: "999px",
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        padding: "40px 20px",
                        textAlign: "center",
                        color: "var(--app-text-muted)",
                        borderBottom: "1px solid var(--app-border)",
                      }}
                    >
                      No products found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div
          style={{
            padding: "14px 18px 18px",
            color: "var(--app-text-muted)",
            fontSize: "14px",
          }}
        >
          <div className="d-flex flex-wrap justify-content-between align-items-center" style={{ gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FontAwesomeIcon icon={faBoxOpen} />
              <span>
                Showing {products.length} product{products.length === 1 ? "" : "s"} in
                inventory
              </span>
            </div>

            <Pagination
              currentPage={inventoryPagination?.page || currentPage}
              totalPages={inventoryPagination?.total_pages || 1}
              onPageChange={setCurrentPage}
              itemsPerPage={inventoryPagination?.limit || INVENTORY_PAGE_LIMIT}
              totalItems={totalProductsCount}
              disabled={loading}
              showItemInfo={false}
            />
          </div>
        </div>
      </section>

      {selectedProduct && (
        <div
          onClick={closeProductDetails}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.52)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1050,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "720px",
              maxHeight: "calc(100vh - 40px)",
              overflowY: "auto",
              background: "var(--app-surface)",
              borderRadius: "14px",
              border: "1px solid var(--app-border)",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.24)",
            }}
          >
            <div
              className="d-flex justify-content-between align-items-center"
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid var(--app-border)",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "var(--app-text)",
                  fontSize: "18px",
                  fontWeight: 700,
                }}
              >
                Product Details
              </h3>

              <Button
                unstyled
                onClick={closeProductDetails}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--app-text-muted)",
                  fontSize: "28px",
                  lineHeight: 1,
                  padding: 0,
                }}
                aria-label="Close product details"
              >
                <FontAwesomeIcon icon={faXmark} />
              </Button>
            </div>

            <div style={{ padding: "20px" }}>
              <h4
                style={{
                  margin: "0 0 20px",
                  color: "var(--app-text)",
                  fontSize: "18px",
                  fontWeight: 700,
                }}
              >
                {selectedProduct.name}
              </h4>

              <div
                style={{
                  width: "100%",
                  height: "266px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
                  marginBottom: "26px",
                }}
              >
                {selectedProduct.image_url ? (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background:
                        "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(14, 116, 144, 0.88) 100%)",
                    }}
                  />
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "28px",
                  marginBottom: "28px",
                }}
              >
                <div>
                  <h5
                    style={{
                      margin: "0 0 18px",
                      color: "var(--app-text)",
                      fontSize: "16px",
                      fontWeight: 700,
                    }}
                  >
                    Basic Information
                  </h5>

                  <div style={{ marginBottom: "16px" }}>
                    <p
                      style={{
                        margin: "0 0 6px",
                        color: "var(--app-text-muted)",
                        fontSize: "14px",
                      }}
                    >
                      Description:
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: "var(--app-text)",
                        fontSize: "15px",
                        lineHeight: 1.8,
                      }}
                    >
                      {selectedProduct.description}
                    </p>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <p
                      style={{
                        margin: "0 0 6px",
                        color: "var(--app-text-muted)",
                        fontSize: "14px",
                      }}
                    >
                      Category:
                    </p>
                    <p style={{ margin: 0, color: "var(--app-text)", fontSize: "15px" }}>
                      {selectedProduct.category}
                    </p>
                  </div>

                  <div>
                    <p
                      style={{
                        margin: "0 0 6px",
                        color: "var(--app-text-muted)",
                        fontSize: "14px",
                      }}
                    >
                      Price:
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: "#16a34a",
                        fontSize: "16px",
                        fontWeight: 700,
                      }}
                    >
                      {selectedProduct.price > 0 ? formatCurrency(selectedProduct.price) : "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <h5
                    style={{
                      margin: "0 0 18px",
                      color: "var(--app-text)",
                      fontSize: "16px",
                      fontWeight: 700,
                    }}
                  >
                    Stock Information
                  </h5>

                  <div style={{ marginBottom: "16px" }}>
                    <p
                      style={{
                        margin: "0 0 6px",
                        color: "var(--app-text-muted)",
                        fontSize: "14px",
                      }}
                    >
                      Current Stock:
                    </p>
                    <div
                      className="d-flex align-items-center justify-content-between"
                      style={{ gap: "12px" }}
                    >
                      <p style={{ margin: 0, color: "var(--app-text)", fontSize: "15px" }}>
                        {selectedProduct.stock} Units
                      </p>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          borderRadius: "999px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: selectedProduct.stockMeta.color,
                          background:
                            selectedProduct.stockMeta.label === "Out of Stock"
                              ? "#feeceb"
                              : selectedProduct.stockMeta.label === "Low Stock"
                                ? "#fff4e5"
                                : "#e8f8e8",
                        }}
                      >
                        {selectedProduct.stockMeta.label}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <p
                      style={{
                        margin: "0 0 6px",
                        color: "var(--app-text-muted)",
                        fontSize: "14px",
                      }}
                    >
                      Low Stock Threshold:
                    </p>
                    <p style={{ margin: 0, color: "var(--app-text)", fontSize: "15px" }}>
                      {selectedProduct.lowStockThreshold} Units
                    </p>
                  </div>

                  <div>
                    <p
                      style={{
                        margin: "0 0 6px",
                        color: "var(--app-text-muted)",
                        fontSize: "14px",
                      }}
                    >
                      Variants:
                    </p>
                    <p style={{ margin: 0, color: "var(--app-text)", fontSize: "15px" }}>
                      {selectedProduct.variants.length} Variant
                      {selectedProduct.variants.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #d9e5f2",
                  borderRadius: "12px",
                  background: "#eef6ff",
                  overflow: "hidden",
                  marginBottom: "22px",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      {["Variant", "SKU", "Units"].map((header) => (
                        <th
                          key={header}
                          style={{
                            padding: "16px 14px 10px",
                            textAlign: header === "Units" ? "right" : "left",
                            color: "var(--app-text)",
                            fontSize: "15px",
                            fontWeight: 700,
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProduct.variants.length > 0 ? (
                      selectedProduct.variants.map((variant) => (
                        <tr key={variant.id}>
                          <td
                            style={{
                              padding: "8px 14px",
                              color: "var(--app-text)",
                              fontSize: "15px",
                            }}
                          >
                            {variant.name}
                          </td>
                          <td
                            style={{
                              padding: "8px 14px",
                              color: "var(--app-text)",
                              fontSize: "15px",
                            }}
                          >
                            {variant.sku}
                          </td>
                          <td
                            style={{
                              padding: "8px 14px",
                              color: "var(--app-text)",
                              fontSize: "15px",
                              textAlign: "right",
                            }}
                          >
                            {variant.units} units
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="3"
                          style={{
                            padding: "14px",
                            color: "var(--app-text-muted)",
                            fontSize: "14px",
                            textAlign: "center",
                          }}
                        >
                          No variants available for this product.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-end">
                <Button
                  unstyled
                  onClick={closeProductDetails}
                  style={{
                    border: "none",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #0d7cff 0%, #0273f9 100%)",
                    color: "#ffffff",
                    padding: "14px 24px",
                    fontWeight: 600,
                    fontSize: "15px",
                    boxShadow: "0 12px 24px rgba(2, 115, 249, 0.18)",
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <ProductFormDesigner
          title="Add New Product"
          isSubmitting={storeLoading}
          loadingLabel="Creating..."
          submitLabel="Publish Product"
          productForm={productForm}
          onSubmit={handleCreateProduct}
          onClose={closeCreateProductModal}
          onProductNameChange={handleProductNameChange}
          onProductFormChange={handleProductFormChange}
          selectedCategory={selectedCategory}
          categoryInput={categoryInput}
          categoryOptions={categoryOptions}
          categoriesLoading={categoriesLoading}
          showCategoryDropdown={showCategoryDropdown}
          onCategoryInputChange={handleCategoryInputChange}
          onCategorySelect={handleCategorySelect}
          onCategoryFocus={() => setShowCategoryDropdown(true)}
          onCategoryBlur={handleCategoryInputBlur}
          imageInputRef={profileInputRef}
          optionImageRef={optionImageRef}
          productImageSrc={productImage?.preview || ""}
          onProductImageClick={() => triggerInput(profileInputRef)}
          onProductImageChange={handleImageChange}
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
          canToggleVisibility
          canMarkFeatured
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
            zIndex: 1100,
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
              <h6>Add New Product</h6>
              <Button
                unstyled
                onClick={closeCreateProductModal}
                style={{ background: "transparent", border: "none", padding: 0 }}
              >
                <FontAwesomeIcon icon={faXmark} style={{ cursor: "pointer", fontSize: "18px" }} />
              </Button>
            </div>

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
                        Stock <span className="text-danger">*</span>
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
                        Category <span className="text-danger">*</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          className={styles["input-item"]}
                          placeholder={
                            categoriesLoading
                              ? "Loading categories..."
                              : "Select or type category"
                          }
                          value={categoryInput}
                          onChange={handleCategoryInputChange}
                          onFocus={() => setShowCategoryDropdown(true)}
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
                                  fontWeight: selectedCategory === category ? "500" : "normal",
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
                      <label style={dropStyles.imageWrapper}>
                        <div
                          style={dropStyles.imageCircle}
                          onClick={() => triggerInput(profileInputRef)}
                        >
                          {productImage?.preview ? (
                            <img
                              src={productImage.preview}
                              alt="Preview"
                              style={dropStyles.previewImage}
                            />
                          ) : (
                            <div style={dropStyles.placeholderCircle} />
                          )}
                        </div>

                        <input
                          type="file"
                          accept="image/*"
                          ref={profileInputRef}
                          onChange={handleImageChange}
                          style={{ display: "none" }}
                        />
                        <Button
                          unstyled
                          type="button"
                          onClick={() => triggerInput(profileInputRef)}
                          style={dropStyles.uploadBtn}
                        >
                          <FontAwesomeIcon icon={faUpload} style={{ marginRight: "8px" }} />
                          Upload Image
                        </Button>
                      </label>
                      <p style={dropStyles.note}>
                        Recommended: Square image, at least 300x300px
                      </p>
                    </div>
                  </div>
                </div>

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
                  <Button
                    unstyled
                    type="button"
                    className={`${styles["sk-btn"]} me-2`}
                    onClick={closeCreateProductModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    unstyled
                    type="submit"
                    className={`${styles["si-btn"]} btn-lg px-5 py-3`}
                    disabled={storeLoading}
                  >
                    {storeLoading ? (
                      <>
                        <div className="spinner-border spinner-border-sm text-light" role="status">
                          <span className="sr-only" />
                        </div>
                        <span className="ms-2">Creating...</span>
                      </>
                    ) : (
                      "Add Product"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;
