import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
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
} from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "react-redux";
import Button from "../../../components/ui/Button";
import { getInventoryCollections } from "../../../slice/inventory";

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
  const deferredSearch = useDeferredValue(searchQuery.trim().toLowerCase());

  const { collectionsLoading, collectionsError, inventoryCollections } = useSelector(
    (state) => state.inventory
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    dispatch(getInventoryCollections({ token, id: storeId }));
  }, [dispatch, storeId, token]);

  const filteredCollections = useMemo(() => {
    return (inventoryCollections || []).filter((collection) => {
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
  }, [deferredSearch, inventoryCollections, typeFilter, visibilityFilter]);

  const totalCollections = inventoryCollections?.length || 0;
  const pinnedCollections = (inventoryCollections || []).filter(
    (collection) => collection?.is_pinned
  ).length;
  const visibleCollections = (inventoryCollections || []).filter(
    (collection) => collection?.is_visible
  ).length;
  const totalItems = (inventoryCollections || []).reduce(
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

  const refreshCollections = () => {
    if (!token) {
      return;
    }

    dispatch(getInventoryCollections({ token, id: storeId }));
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
            disabled={collectionsLoading || !token}
            style={{
              border: "1px solid var(--app-border)",
              borderRadius: "10px",
              background: "var(--app-surface)",
              color: "var(--app-text)",
              padding: "14px 18px",
              fontWeight: 600,
              fontSize: "15px",
              opacity: collectionsLoading || !token ? 0.6 : 1,
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

          {collectionsLoading ? (
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
                    <div className="d-flex justify-content-between align-items-start" style={{ gap: "12px" }}>
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
                                collection?.collection_type === "service"
                                  ? "#8b5cf6"
                                  : "#0d7cff",
                              background:
                                collection?.collection_type === "service"
                                  ? "#f2eaff"
                                  : "#eaf3ff",
                              textTransform: "capitalize",
                            }}
                          >
                            {collection?.collection_type || "collection"}
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
                        { label: "Layout", value: collection?.layout_type || "-" },
                        { label: "Sort Order", value: String(collection?.sort_order ?? "-") },
                        { label: "Products", value: String(collection?.productCount ?? 0) },
                        { label: "Services", value: String(collection?.serviceCount ?? 0) },
                      ].map((item) => (
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
                            textTransform:
                              item.label === "Layout" ? "capitalize" : "none",
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
                        onClick={() => setActiveTab?.("inventory-products")}
                        style={{
                          border: "1px solid var(--app-border)",
                          borderRadius: "10px",
                          background: "var(--app-surface)",
                          color: "var(--app-text)",
                          padding: "10px 14px",
                          fontWeight: 600,
                          fontSize: "13px",
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
        </div>
      </section>
    </div>
  );
};

export default Collection;
