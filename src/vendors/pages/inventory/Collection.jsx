import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faBoxesStacked,
  faBoxOpen,
  faChevronDown,
  faEye,
  faLayerGroup,
  faMagnifyingGlass,
  faPlus,
  faRotateRight,
  faThumbtack,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useDispatch } from "react-redux";
import Button from "../../../components/ui/Button";
import { API_URL } from "../../../config/constant";
import {
  getProductOfSingleCollection,
  getServiceCollection,
} from "../../../slice/onlineStoreSlice";

const COLLECTIONS_PAGE_SIZE = 20;
const COLLECTION_ITEMS_PAGE_SIZE = 50;
const DEFAULT_PAGINATION = {
  page: 1,
  limit: COLLECTIONS_PAGE_SIZE,
  total_pages: 0,
  total_items: 0,
};
const IMAGE_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 280'><rect width='400' height='280' rx='28' fill='#eff6ff'/><rect x='110' y='72' width='180' height='136' rx='24' fill='#dbeafe'/><circle cx='170' cy='124' r='18' fill='#93c5fd'/><path d='M118 192l52-46 38 30 44-56 34 72H118z' fill='#60a5fa'/><text x='200' y='238' text-anchor='middle' font-family='Arial, sans-serif' font-size='24' fill='#2563eb'>No Image</text></svg>"
)}`;

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatCurrency = (value) => {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "₦0";
  }

  return `₦${amount.toLocaleString("en-NG")}`;
};

const humanizeText = (value) => {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  return text
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getCollectionTypeLabel = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (normalized === "service" || (normalized.includes("service") && !normalized.includes("product"))) {
    return "Service";
  }

  if (normalized === "product" || normalized.includes("product")) {
    return "Product";
  }

  return "Collection";
};

const resolveApiAssetUrl = (value) => {
  if (Array.isArray(value)) {
    return resolveApiAssetUrl(value[0]);
  }

  if (value && typeof value === "object") {
    return resolveApiAssetUrl(
      value.url || value.secure_url || value.image_url || value.path || value.location
    );
  }

  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  const assetPath = value.trim();

  if (/^(https?:|data:|blob:|\/\/)/i.test(assetPath)) {
    return assetPath;
  }

  const apiOrigin = API_URL.replace(/\/api\/v\d+\/?$/i, "");
  return assetPath.startsWith("/") ? `${apiOrigin}${assetPath}` : assetPath;
};

const normalizeCollectionsResponse = (payload) => {
  const responseData = payload?.data ?? payload ?? {};
  const source =
    responseData?.data && typeof responseData.data === "object"
      ? responseData.data
      : responseData;
  const collections = source?.collections ?? responseData?.collections ?? [];
  const pagination = source?.pagination ?? responseData?.pagination ?? {};

  return {
    collections: Array.isArray(collections) ? collections : [],
    pagination: {
      page: Number(pagination?.page) || 1,
      limit:
        Number(pagination?.limit) ||
        Number(pagination?.per_page) ||
        COLLECTIONS_PAGE_SIZE,
      total_pages:
        Number(pagination?.total_pages) ||
        Number(pagination?.totalPages) ||
        0,
      total_items:
        Number(pagination?.total_items) ||
        Number(pagination?.totalItems) ||
        Number(pagination?.total) ||
        0,
    },
  };
};

const mergeUniqueById = (existingItems, incomingItems) => {
  const mergedItems = [...existingItems];
  const seenIds = new Set(
    existingItems
      .map((item, index) => item?.id ?? item?.collection_id ?? item?.service_id ?? `existing-${index}`)
      .map((value) => String(value))
  );

  incomingItems.forEach((item, index) => {
    const itemId = String(
      item?.id ?? item?.collection_id ?? item?.service_id ?? `incoming-${index}`
    );

    if (!seenIds.has(itemId)) {
      seenIds.add(itemId);
      mergedItems.push(item);
    }
  });

  return mergedItems;
};

const buildCollectionItemCardData = (item, collectionType, index) => {
  const resolvedType = getCollectionTypeLabel(collectionType);

  if (resolvedType === "Service") {
    const service = item?.StoreService || item?.Service || item?.service || item || {};

    return {
      id: String(service?.id ?? item?.id ?? `service-${index}`),
      image:
        resolveApiAssetUrl(
          service?.service_image_url ||
            service?.service_image ||
            service?.image_url ||
            service?.image
        ) || IMAGE_PLACEHOLDER,
      name: service?.service_title || service?.title || service?.name || "Service",
      price: formatCurrency(service?.price ?? 0),
      meta: humanizeText(service?.status || service?.location_type || "Service"),
    };
  }

  const product = item?.Product || item?.product || item || {};
  const visibilityStatus =
    typeof product?.is_published === "boolean"
      ? product.is_published
        ? "Published"
        : "Unpublished"
      : "";

  return {
    id: String(product?.id ?? item?.id ?? `product-${index}`),
    image:
      resolveApiAssetUrl(
        product?.image_url ||
          product?.image ||
          product?.product_image_url ||
          product?.product_image
      ) || IMAGE_PLACEHOLDER,
    name: product?.name || product?.product_name || product?.title || "Product",
    price: formatCurrency(product?.price ?? product?.cost ?? 0),
    meta: humanizeText(product?.stock_status || product?.status || visibilityStatus || "Product"),
  };
};

const getErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallbackMessage;

const statIconWrapStyle = {
  width: "42px",
  height: "42px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
};

const Collection = ({ setActiveTab }) => {
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const storeId =
    typeof window !== "undefined"
      ? Number(window.localStorage.getItem("itemId") || 6)
      : 6;
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [collections, setCollections] = useState([]);
  const [collectionsPagination, setCollectionsPagination] = useState({
    ...DEFAULT_PAGINATION,
  });
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionsError, setCollectionsError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreCollections, setHasMoreCollections] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [collectionItems, setCollectionItems] = useState([]);
  const [collectionItemsLoading, setCollectionItemsLoading] = useState(false);
  const [collectionItemsError, setCollectionItemsError] = useState("");
  const deferredSearch = useDeferredValue(searchQuery.trim().toLowerCase());
  const sentinelRef = useRef(null);
  const collectionsRef = useRef([]);
  const isFetchingNextPageRef = useRef(false);
  const modalRequestRef = useRef(0);

  collectionsRef.current = collections;

  useEffect(() => {
    if (!token) {
      setCollections([]);
      setCollectionsPagination({ ...DEFAULT_PAGINATION });
      setCollectionsLoading(false);
      setCollectionsError("");
      setCurrentPage(1);
      setHasMoreCollections(true);
      setIsLoadingMore(false);
      return;
    }

    let isActive = true;

    const fetchCollectionsPage = async () => {
      isFetchingNextPageRef.current = true;

      if (currentPage === 1) {
        setCollectionsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      setCollectionsError("");

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(COLLECTIONS_PAGE_SIZE),
        });

        const response = await axios.get(
          `${API_URL}/stores/online/${storeId}/collections?${params.toString()}`,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          }
        );

        if (!isActive) {
          return;
        }

        const { collections: nextCollections, pagination } = normalizeCollectionsResponse(
          response.data
        );
        const baseCollections = currentPage === 1 ? [] : collectionsRef.current;
        const mergedCollections = mergeUniqueById(baseCollections, nextCollections);
        const resolvedPagination = {
          page: pagination.page || currentPage,
          limit: pagination.limit || COLLECTIONS_PAGE_SIZE,
          total_pages: pagination.total_pages || 0,
          total_items: pagination.total_items || 0,
        };
        const noNewCollections =
          currentPage > 1 && mergedCollections.length === baseCollections.length;
        const reachedLastPage =
          resolvedPagination.total_pages > 0 && currentPage >= resolvedPagination.total_pages;
        const reachedTotalItems =
          resolvedPagination.total_items > 0 &&
          mergedCollections.length >= resolvedPagination.total_items;
        const returnedLessThanLimit =
          nextCollections.length < (resolvedPagination.limit || COLLECTIONS_PAGE_SIZE);
        const noMoreResults =
          nextCollections.length === 0 ||
          noNewCollections ||
          reachedLastPage ||
          reachedTotalItems ||
          (resolvedPagination.total_pages === 0 && returnedLessThanLimit);

        setCollections(mergedCollections);
        setCollectionsPagination(resolvedPagination);
        setHasMoreCollections(!noMoreResults);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setCollectionsError(
          getErrorMessage(error, "Unable to fetch inventory collections.")
        );
        setHasMoreCollections(false);

        if (currentPage === 1) {
          setCollections([]);
        }
      } finally {
        if (isActive) {
          setCollectionsLoading(false);
          setIsLoadingMore(false);
          isFetchingNextPageRef.current = false;
        }
      }
    };

    fetchCollectionsPage();

    return () => {
      isActive = false;
    };
  }, [currentPage, refreshKey, storeId, token]);

  useEffect(() => {
    if (
      !token ||
      !hasMoreCollections ||
      collectionsLoading ||
      isLoadingMore ||
      !sentinelRef.current
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry?.isIntersecting || isFetchingNextPageRef.current) {
          return;
        }

        isFetchingNextPageRef.current = true;
        setCurrentPage((previousPage) => previousPage + 1);
      },
      {
        root: null,
        rootMargin: "180px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [collectionsLoading, hasMoreCollections, isLoadingMore, token]);

  useEffect(() => {
    if (typeof document === "undefined" || !isInventoryModalOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isInventoryModalOpen]);

  const filteredCollections = useMemo(() => {
    return collections.filter((collection) => {
      const name = collection?.collection_name?.toLowerCase?.() || "";
      const matchesSearch = !deferredSearch || name.includes(deferredSearch);
      const matchesType =
        !typeFilter || collection?.collection_type === typeFilter;
      const matchesVisibility =
        !visibilityFilter ||
        (visibilityFilter === "visible" && collection?.is_visible) ||
        (visibilityFilter === "hidden" && !collection?.is_visible);

      return matchesSearch && matchesType && matchesVisibility;
    });
  }, [collections, deferredSearch, typeFilter, visibilityFilter]);

  const totalCollections = collectionsPagination?.total_items || collections.length || 0;
  const pinnedCollections = collections.filter((collection) => collection?.is_pinned).length;
  const visibleCollections = collections.filter((collection) => collection?.is_visible).length;
  const totalItems = collections.reduce(
    (sum, collection) => sum + Number(collection?.totalItems || 0),
    0
  );

  const stats = [
    {
      title: "Total Collections",
      value: String(totalCollections),
      meta: "Across your store",
      icon: faLayerGroup,
      color: "#0d7cff",
      background: "#eaf3ff",
    },
    {
      title: "Pinned Collections",
      value: String(pinnedCollections),
      meta: "Featured first",
      icon: faThumbtack,
      color: "#f59e0b",
      background: "#fff4e5",
    },
    {
      title: "Visible Collections",
      value: String(visibleCollections),
      meta: "Currently shown to customers",
      icon: faEye,
      color: "#16a34a",
      background: "#e8f8e8",
    },
    {
      title: "Items In Collections",
      value: String(totalItems),
      meta: "Products and services grouped",
      icon: faBoxesStacked,
      color: "#8b5cf6",
      background: "#f2eaff",
    },
  ];

  const closeInventoryModal = () => {
    modalRequestRef.current += 1;
    setIsInventoryModalOpen(false);
    setSelectedCollection(null);
    setCollectionItems([]);
    setCollectionItemsError("");
    setCollectionItemsLoading(false);
  };

  const loadCollectionItems = async (collection) => {
    if (!token || !collection?.id) {
      setCollectionItems([]);
      setCollectionItemsError("");
      setCollectionItemsLoading(false);
      return;
    }

    const requestId = modalRequestRef.current + 1;
    modalRequestRef.current = requestId;
    setCollectionItemsLoading(true);
    setCollectionItemsError("");

    try {
      let normalizedItems = [];

      if (getCollectionTypeLabel(collection?.collection_type) === "Service") {
        const response = await dispatch(
          getServiceCollection({ token, id: collection.id })
        ).unwrap();
        const responseData = response?.data ?? response ?? {};
        const source =
          responseData?.data && typeof responseData.data === "object"
            ? responseData.data
            : responseData;
        const services = source?.services ?? responseData?.services ?? [];

        normalizedItems = mergeUniqueById([], Array.isArray(services) ? services : []).map(
          (item, index) => buildCollectionItemCardData(item, "service", index)
        );
      } else {
        let page = 1;
        let shouldContinue = true;
        let productItems = [];

        while (shouldContinue) {
          const response = await dispatch(
            getProductOfSingleCollection({
              token,
              id: collection.id,
              page,
              limit: COLLECTION_ITEMS_PAGE_SIZE,
            })
          ).unwrap();
          const responseData = response?.data ?? response ?? {};
          const source =
            responseData?.data && typeof responseData.data === "object"
              ? responseData.data
              : responseData;
          const products = source?.products ?? responseData?.products ?? [];
          const pagination = source?.pagination ?? responseData?.pagination ?? {};
          const resolvedLimit =
            Number(pagination?.limit) ||
            Number(pagination?.per_page) ||
            COLLECTION_ITEMS_PAGE_SIZE;
          const totalPages =
            Number(pagination?.total_pages) || Number(pagination?.totalPages) || 0;

          productItems = mergeUniqueById(productItems, Array.isArray(products) ? products : []);

          if (!Array.isArray(products) || products.length === 0) {
            shouldContinue = false;
          } else if (totalPages > 0) {
            shouldContinue = page < totalPages;
          } else {
            shouldContinue = products.length >= resolvedLimit;
          }

          page += 1;

          if (page > 100) {
            shouldContinue = false;
          }
        }

        normalizedItems = productItems.map((item, index) =>
          buildCollectionItemCardData(item, "product", index)
        );
      }

      if (modalRequestRef.current !== requestId) {
        return;
      }

      setCollectionItems(normalizedItems);
    } catch {
      if (modalRequestRef.current !== requestId) {
        return;
      }

      setCollectionItems([]);
      setCollectionItemsError("Failed to load items. Please try again.");
    } finally {
      if (modalRequestRef.current === requestId) {
        setCollectionItemsLoading(false);
      }
    }
  };

  const openInventoryModal = (collection) => {
    setSelectedCollection(collection);
    setCollectionItems([]);
    setCollectionItemsError("");
    setIsInventoryModalOpen(true);
    loadCollectionItems(collection);
  };

  const refreshCollections = () => {
    if (!token) {
      return;
    }

    isFetchingNextPageRef.current = false;
    setCollections([]);
    setCollectionsPagination({ ...DEFAULT_PAGINATION });
    setCollectionsError("");
    setHasMoreCollections(true);
    setCurrentPage(1);
    setRefreshKey((currentKey) => currentKey + 1);
  };

  return (
    <div style={{ color: "var(--app-text)" }}>
      <style>
        {`
          .inventory-collection-modal-backdrop {
            position: fixed;
            inset: 0;
            z-index: 1200;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: rgba(15, 23, 42, 0.58);
            backdrop-filter: blur(2px);
          }

          .inventory-collection-modal {
            width: min(1120px, 100%);
            max-height: calc(100vh - 48px);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border-radius: 20px;
            border: 1px solid rgba(226, 232, 240, 0.75);
            background: var(--app-surface);
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22);
          }

          .inventory-collection-modal-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
          }

          @media (max-width: 991px) {
            .inventory-collection-modal-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 767px) {
            .inventory-collection-modal-backdrop {
              padding: 16px;
              align-items: flex-end;
            }

            .inventory-collection-modal {
              width: 100%;
              max-height: calc(100vh - 16px);
              border-radius: 18px 18px 0 0;
            }

            .inventory-collection-modal-grid {
              grid-template-columns: minmax(0, 1fr);
            }
          }
        `}
      </style>

      <div
        className="d-flex flex-wrap justify-content-between align-items-start"
        style={{ gap: "16px", marginBottom: "24px" }}
      >
        <div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "6px",
              color: "var(--app-text)",
            }}
          >
            Inventory Collections
          </h2>
          <p
            style={{
              margin: 0,
              color: "var(--app-text-muted)",
              fontSize: "15px",
            }}
          >
            Organize your inventory into visible, branded collection groups.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center" style={{ gap: "12px" }}>
          <Button
            unstyled
            onClick={refreshCollections}
            disabled={collectionsLoading || isLoadingMore || !token}
            style={{
              border: "1px solid var(--app-border)",
              borderRadius: "10px",
              background: "var(--app-surface)",
              color: "var(--app-text)",
              padding: "14px 18px",
              fontWeight: 600,
              fontSize: "15px",
              opacity: collectionsLoading || isLoadingMore || !token ? 0.6 : 1,
            }}
          >
            <FontAwesomeIcon icon={faRotateRight} style={{ marginRight: "10px" }} />
            Refresh
          </Button>

          <Button
            unstyled
            onClick={() => setActiveTab?.("inventory-products")}
            style={{
              border: "none",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0d7cff 0%, #0273f9 100%)",
              color: "#ffffff",
              padding: "14px 18px",
              fontWeight: 600,
              fontSize: "15px",
              boxShadow: "0 12px 24px rgba(2, 115, 249, 0.18)",
            }}
          >
            <FontAwesomeIcon icon={faPlus} style={{ marginRight: "10px" }} />
            View Products
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
          Collection data requires an authenticated vendor session.
        </div>
      )}

      {collectionsError && (
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
          {collectionsError}
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
                    fontSize: "14px",
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
                  }}
                >
                  {stat.value}
                </h3>
              </div>

              <span
                style={{
                  ...statIconWrapStyle,
                  color: stat.color,
                  background: stat.background,
                }}
              >
                <FontAwesomeIcon icon={stat.icon} />
              </span>
            </div>

            <p
              style={{
                margin: 0,
                color: "#22c55e",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FontAwesomeIcon icon={faArrowTrendUp} />
              <span>{stat.meta}</span>
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
            Collection Directory
          </h3>
        </div>

        <div style={{ padding: "16px" }}>
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
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search collections"
                aria-label="Search collections"
                style={{
                  width: "100%",
                  height: "44px",
                  borderRadius: "10px",
                  border: "1px solid var(--app-border)",
                  background: "var(--app-surface)",
                  color: "var(--app-text)",
                  fontSize: "13px",
                  padding: "0 14px 0 42px",
                  outline: "none",
                }}
              />
            </div>

            <div className="d-flex flex-wrap align-items-center" style={{ gap: "10px" }}>
              <div style={{ position: "relative" }}>
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  aria-label="Filter by type"
                  style={{
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    minWidth: "150px",
                    height: "44px",
                    borderRadius: "10px",
                    border: "1px solid var(--app-border)",
                    background: "var(--app-surface)",
                    color: "var(--app-text-muted)",
                    fontSize: "13px",
                    padding: "0 40px 0 14px",
                    outline: "none",
                  }}
                >
                  <option value="">All Types</option>
                  <option value="product">Product</option>
                  <option value="service">Service</option>
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
                  value={visibilityFilter}
                  onChange={(event) => setVisibilityFilter(event.target.value)}
                  aria-label="Filter by visibility"
                  style={{
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    minWidth: "150px",
                    height: "44px",
                    borderRadius: "10px",
                    border: "1px solid var(--app-border)",
                    background: "var(--app-surface)",
                    color: "var(--app-text-muted)",
                    fontSize: "13px",
                    padding: "0 40px 0 14px",
                    outline: "none",
                  }}
                >
                  <option value="">All Visibility</option>
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
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
            </div>
          </div>

          {collectionsLoading && collections.length === 0 ? (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                color: "var(--app-text-muted)",
              }}
            >
              Loading collections...
            </div>
          ) : filteredCollections.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "18px",
              }}
            >
              {filteredCollections.map((collection) => (
                <article
                  key={collection.id}
                  style={{
                    border: "1px solid var(--app-border)",
                    borderRadius: "16px",
                    background:
                      "linear-gradient(180deg, rgba(234, 244, 255, 0.42) 0%, rgba(255, 255, 255, 1) 50%)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "18px 18px 14px",
                      borderBottom: "1px solid rgba(229, 231, 235, 0.8)",
                    }}
                  >
                    <div
                      className="d-flex justify-content-between align-items-start"
                      style={{ gap: "12px" }}
                    >
                      <div>
                        <div
                          className="d-inline-flex align-items-center"
                          style={{
                            gap: "8px",
                            marginBottom: "10px",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              borderRadius: "999px",
                              padding: "5px 10px",
                              fontSize: "11px",
                              fontWeight: 600,
                              color:
                                collection?.type === "service"
                                  ? "#8b5cf6"
                                  : "#0d7cff",
                              background:
                                collection?.type === "service"
                                  ? "#f2eaff"
                                  : "#eaf3ff",
                            }}
                          >
                            {collection?.type === "product"
                              ? "Product"
                              : collection?.type === "service"
                                ? "Service"
                                : getCollectionTypeLabel(collection?.collection_type)}
                          </span>
                          {collection?.is_pinned && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                borderRadius: "999px",
                                padding: "5px 10px",
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#b45309",
                                background: "#fff4e5",
                              }}
                            >
                              <FontAwesomeIcon icon={faThumbtack} />
                              Pinned
                            </span>
                          )}
                        </div>

                        <h4
                          style={{
                            margin: 0,
                            color: "var(--app-text)",
                            fontSize: "16px",
                            fontWeight: 700,
                          }}
                        >
                          {collection?.collection_name || "Untitled collection"}
                        </h4>
                      </div>

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          borderRadius: "999px",
                          padding: "6px 10px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: collection?.is_visible ? "#15803d" : "#b91c1c",
                          background: collection?.is_visible ? "#e8f8e8" : "#feeceb",
                        }}
                      >
                        {collection?.is_visible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: "18px" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: "12px",
                        marginBottom: "18px",
                      }}
                    >
                      {[
                        collection?.type === "product" && {
                          label: "Products",
                          value: String(collection?.productCount ?? 0),
                        },
                        collection?.type === "service" && {
                          label: "Services",
                          value: String(collection?.serviceCount ?? 0),
                        },
                      ]
                        .filter(Boolean)
                        .map((item) => (
                        <div
                          key={item.label}
                          style={{
                            padding: "12px",
                            borderRadius: "12px",
                            background: "var(--app-surface)",
                            border: "1px solid var(--app-border)",
                          }}
                        >
                          <p
                            style={{
                              margin: "0 0 6px",
                              color: "var(--app-text-muted)",
                              fontSize: "12px",
                            }}
                          >
                            {item.label}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              color: "var(--app-text)",
                              fontSize: "14px",
                              fontWeight: 600,
                            }}
                          >
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div
                      className="d-flex justify-content-between align-items-center"
                      style={{
                        padding: "14px 16px",
                        borderRadius: "12px",
                        background: "var(--app-surface-2)",
                        marginBottom: "16px",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: "0 0 6px",
                            color: "var(--app-text-muted)",
                            fontSize: "12px",
                          }}
                        >
                          Total Items
                        </p>
                        <p
                          style={{
                            margin: 0,
                            color: "var(--app-text)",
                            fontSize: "17px",
                            fontWeight: 700,
                          }}
                        >
                          {collection?.totalItems ?? 0}
                        </p>
                      </div>

                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "14px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#0273f9",
                          background: "#eaf3ff",
                        }}
                      >
                        <FontAwesomeIcon icon={faBoxOpen} />
                      </div>
                    </div>

                    <div
                      className="d-flex justify-content-between align-items-center"
                      style={{ gap: "12px" }}
                    >
                      <div>
                        <p
                          style={{
                            margin: "0 0 4px",
                            color: "var(--app-text-muted)",
                            fontSize: "12px",
                          }}
                        >
                          Created
                        </p>
                        <p
                          style={{
                            margin: 0,
                            color: "var(--app-text)",
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        >
                          {formatDate(collection?.created_at)}
                        </p>
                      </div>

                      <Button
                        unstyled
                        onClick={() => openInventoryModal(collection)}
                        disabled={!token}
                        style={{
                          border: "1px solid var(--app-border)",
                          borderRadius: "10px",
                          background: "var(--app-surface)",
                          color: "var(--app-text)",
                          padding: "10px 14px",
                          fontWeight: 600,
                          fontSize: "13px",
                          opacity: !token ? 0.6 : 1,
                        }}
                      >
                        Open Inventory
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "48px 20px",
                borderRadius: "16px",
                border: "1px dashed var(--app-border-strong)",
                background: "var(--app-surface-2)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "18px",
                  background: "#eaf3ff",
                  color: "#0273f9",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  marginBottom: "16px",
                }}
              >
                <FontAwesomeIcon icon={faLayerGroup} />
              </div>

              <h4
                style={{
                  margin: "0 0 8px",
                  color: "var(--app-text)",
                  fontSize: "18px",
                  fontWeight: 700,
                }}
              >
                No collections found
              </h4>

              <p
                style={{
                  margin: "0 auto",
                  maxWidth: "420px",
                  color: "var(--app-text-muted)",
                  fontSize: "15px",
                  lineHeight: 1.7,
                }}
              >
                There are no collections matching your current filters yet. Refresh the
                page or switch to products while the collection workflow is being built.
              </p>
            </div>
          )}

          {(hasMoreCollections || isLoadingMore) && !collectionsLoading && (
            <div
              ref={sentinelRef}
              style={{
                padding: "18px 0 6px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {isLoadingMore ? (
                <div
                  className="d-inline-flex align-items-center"
                  style={{
                    gap: "10px",
                    color: "var(--app-text-muted)",
                    fontSize: "13px",
                  }}
                >
                  <div className="spinner-border spinner-border-sm text-primary" role="status" />
                  <span>Loading more collections...</span>
                </div>
              ) : (
                <span
                  aria-hidden="true"
                  style={{ width: "1px", height: "1px", opacity: 0 }}
                />
              )}
            </div>
          )}
        </div>
      </section>

      {isInventoryModalOpen && (
        <div
          className="inventory-collection-modal-backdrop"
          onClick={closeInventoryModal}
          role="presentation"
        >
          <div
            className="inventory-collection-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-collection-modal-title"
          >
            <div
              className="d-flex justify-content-between align-items-start"
              style={{
                padding: "22px 24px 18px",
                borderBottom: "1px solid var(--app-border)",
                gap: "16px",
              }}
            >
              <div>
                <h3
                  id="inventory-collection-modal-title"
                  style={{
                    margin: 0,
                    color: "var(--app-text)",
                    fontSize: "20px",
                    fontWeight: 700,
                  }}
                >
                  {selectedCollection?.collection_name || "Collection"} — Items
                </h3>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "var(--app-text-muted)",
                    fontSize: "14px",
                  }}
                >
                  Browse everything currently inside this collection.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close inventory items modal"
                onClick={closeInventoryModal}
                style={{
                  border: "1px solid var(--app-border)",
                  background: "var(--app-surface)",
                  color: "var(--app-text)",
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div
              style={{
                padding: "24px",
                overflowY: "auto",
                background: "linear-gradient(180deg, rgba(248, 250, 252, 0.75) 0%, rgba(255, 255, 255, 1) 100%)",
              }}
            >
              {collectionItemsLoading ? (
                <div
                  style={{
                    minHeight: "260px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "14px",
                    color: "var(--app-text-muted)",
                  }}
                >
                  <div className="spinner-border text-primary" role="status" />
                  <p style={{ margin: 0, fontSize: "14px" }}>Loading items...</p>
                </div>
              ) : collectionItemsError ? (
                <div
                  style={{
                    minHeight: "260px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "14px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: "#b91c1c",
                      fontSize: "15px",
                      fontWeight: 600,
                    }}
                  >
                    Failed to load items. Please try again.
                  </p>
                  <Button
                    unstyled
                    onClick={() => loadCollectionItems(selectedCollection)}
                    style={{
                      border: "none",
                      borderRadius: "10px",
                      background: "#0273f9",
                      color: "#ffffff",
                      padding: "10px 16px",
                      fontWeight: 600,
                      fontSize: "14px",
                    }}
                  >
                    Retry
                  </Button>
                </div>
              ) : collectionItems.length === 0 ? (
                <div
                  style={{
                    minHeight: "260px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: "var(--app-text-muted)",
                      fontSize: "15px",
                      fontWeight: 500,
                    }}
                  >
                    This collection has no items yet.
                  </p>
                </div>
              ) : (
                <div className="inventory-collection-modal-grid">
                  {collectionItems.map((item) => (
                    <article
                      key={item.id}
                      style={{
                        borderRadius: "18px",
                        overflow: "hidden",
                        background: "var(--app-surface)",
                        border: "1px solid rgba(226, 232, 240, 0.85)",
                        boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
                      }}
                    >
                      <div
                        style={{
                          aspectRatio: "4 / 3",
                          background: "#eff6ff",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={item.image || IMAGE_PLACEHOLDER}
                          alt={item.name}
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = IMAGE_PLACEHOLDER;
                          }}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>

                      <div style={{ padding: "16px" }}>
                        <p
                          style={{
                            margin: "0 0 10px",
                            color: "var(--app-text)",
                            fontSize: "15px",
                            fontWeight: 700,
                            lineHeight: 1.4,
                          }}
                        >
                          {item.name}
                        </p>

                        <p
                          style={{
                            margin: "0 0 12px",
                            color: "#0273f9",
                            fontSize: "15px",
                            fontWeight: 700,
                          }}
                        >
                          {item.price}
                        </p>

                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            borderRadius: "999px",
                            padding: "6px 10px",
                            background: "#f8fafc",
                            color: "var(--app-text-muted)",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {item.meta || getCollectionTypeLabel(selectedCollection?.collection_type)}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collection;
