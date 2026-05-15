import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBagShopping,
  faBoxOpen,
  faChevronRight,
  faLightbulb,
  faMoneyBillWave,
  faPlus,
  faShop,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "react-redux";
import { getDashItem, getTopPerformingProduct, getUserProfile } from "../../../slice/dashboard";
import styles from "../../../styles.module.css";
import { Hm, Ben } from "../../../assets";
import Button from "../../../components/ui/Button";

const statDefinitions = [
  {
    title: "Total Products",
    dataKey: "total_products",
    meta: (value) => `${value} different products`,
    formatValue: (value) => `${value}`,
    icon: faBagShopping,
    accent: "green",
  },
  {
    title: "Active Orders",
    dataKey: "total_active_orders",
    meta: (value) => `${value} active orders`,
    formatValue: (value) => `${value}`,
    icon: faBoxOpen,
    accent: "yellow",
  },
  {
    title: "Total Revenue",
    dataKey: "total_revenue",
    meta: () => "Total revenue generated",
    formatValue: (value) => formatCurrency(value),
    icon: faMoneyBillWave,
    accent: "blue",
  },
  {
    title: "Active Products",
    dataKey: "total_active_products",
    meta: (value) => `${value} published products`,
    formatValue: (value) => `${value}`,
    icon: faShop,
    accent: "purple",
  },
];

const quickActions = [
  {
    label: "Add Products",
    icon: faBagShopping,
    accent: "green",
    tab: "online-store",
  },
  {
    label: "View Store",
    icon: faStore,
    accent: "blue",
    tab: "manage-online-store-manage-store",
  },
];

const periodOptions = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "This Year"];

const statAccentClasses = {
  green: styles.vendorDashboardCardGreen,
  yellow: styles.vendorDashboardCardYellow,
  blue: styles.vendorDashboardCardBlue,
  purple: styles.vendorDashboardCardPurple,
};

const actionAccentClasses = {
  green: styles.vendorDashboardActionGreen,
  blue: styles.vendorDashboardActionBlue,
};

const orderStatusColors = {
  pending: { background: "#fff7ed", color: "#c2410c" },
  confirmed: { background: "#ecfdf3", color: "#15803d" },
  cancelled: { background: "#fef2f2", color: "#b91c1c" },
};

const paymentStatusColors = {
  pending: { background: "#fff7ed", color: "#c2410c" },
  paid: { background: "#ecfdf3", color: "#15803d" },
  failed: { background: "#fef2f2", color: "#b91c1c" },
};

const skeletonStyle = {
  display: "inline-block",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #eef2f7 0%, #e5e7eb 50%, #eef2f7 100%)",
};

function LoadingBlock({ width, height = 16, style = {} }) {
  return <span style={{ ...skeletonStyle, width, height, ...style }} />;
}

const formatCurrency = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "₦0.00";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatStatusLabel = (value) => {
  if (!value) {
    return "Unknown";
  }

  return value
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getErrorMessage = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return (
    value?.message ||
    value?.error ||
    value?.detail ||
    value?.data?.message ||
    "Unable to load dashboard data."
  );
};

const getStatusBadgeStyle = (palette, value) => {
  const colors = palette[value?.toLowerCase?.()] || {
    background: "#f3f4f6",
    color: "#4b5563",
  };

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 700,
    lineHeight: 1,
    whiteSpace: "nowrap",
    ...colors,
  };
};

const formatUnitsSold = (value) => {
  const quantity = Number(value);

  if (!Number.isFinite(quantity)) {
    return "0";
  }

  return `${quantity}`;
};

const Home = ({ setActiveTab }) => {
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const { dashItem, dashStats, profile } = useSelector((state) => state.dashboard);
  const [dashboardLoading, setDashboardLoading] = useState(Boolean(token));
  const [dashboardError, setDashboardError] = useState("");
  const [topProductsLoading, setTopProductsLoading] = useState(Boolean(token));
  const [topProductsError, setTopProductsError] = useState("");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const errorMessage = dashboardError;
  const dashboardData = useMemo(
    () => (!errorMessage ? dashItem?.data || {} : {}),
    [dashItem, errorMessage]
  );
  const recentOrders = Array.isArray(dashboardData?.recent_orders)
    ? dashboardData.recent_orders
    : [];
  const topProducts = useMemo(() => {
    if (topProductsError) {
      return [];
    }

    const rankedProducts = Array.isArray(dashStats?.data?.top_products_orders)
      ? dashStats.data.top_products_orders
      : [];

    return rankedProducts.map((product, index) => ({
      id: product?.product_id || `${product?.product_name || "product"}-${index}`,
      rank: index + 1,
      name: product?.product_name || "Product",
      unitsSold: formatUnitsSold(product?.total_quantity),
      revenue: formatCurrency(product?.total_revenue),
    }));
  }, [dashStats, topProductsError]);

  const goToTab = (tab) => {
    if (setActiveTab && tab) {
      setActiveTab(tab);
    }
  };

  const bannerStyle = {
    "--vendor-dashboard-banner-image": `url(${Hm})`,
  };

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const dashRequest = dispatch(getDashItem({ token }));
    const topProductsRequest = dispatch(getTopPerformingProduct({ token }));
    const userProfile = dispatch(getUserProfile({ token }));


    dashRequest
      .unwrap()
      .catch((requestError) => {
        if (isMounted) {
          setDashboardError(getErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setDashboardLoading(false);
        }
      });

    topProductsRequest
      .unwrap()
      .catch((requestError) => {
        if (isMounted) {
          setTopProductsError(getErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setTopProductsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      dashRequest.abort();
      topProductsRequest.abort();
    };
  }, [dispatch, token]);

  const stats = useMemo(
    () =>
      statDefinitions.map((stat) => {
        const rawValue = Number(dashboardData?.[stat.dataKey] ?? 0);
        const resolvedValue = Number.isFinite(rawValue) ? rawValue : 0;

        return {
          ...stat,
          value: errorMessage ? "--" : stat.formatValue(resolvedValue),
          meta: errorMessage ? "Unable to load data" : stat.meta(resolvedValue),
        };
      }),
    [dashboardData, errorMessage]
  );

  return (
    <div className={styles.vendorDashboard}>
      <div className={styles.vendorDashboardHeader}>
        <div>
          <h4 className={styles.vendorDashboardTitle}>Dashboard</h4>
          <p className={styles.vendorDashboardDate}>{today}</p>
        </div>

        <select
          className={styles.vendorDashboardPeriod}
          defaultValue="Last 30 Days"
          aria-label="Select dashboard date range"
        >
          {periodOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <section className={styles.vendorDashboardBanner} style={bannerStyle}>
        <div className={styles.vendorDashboardBannerContent}>
          <div className={styles.vendorDashboardBannerBadge}>
            <FontAwesomeIcon icon={faLightbulb} />
          </div>

          <div className={styles.vendorDashboardBannerCopy}>
            <h2>Quick Tip of the Day</h2>
            <p>Unlock more features with Enterprise plan.</p>

            <button
              type="button"
              className={styles.vendorDashboardLink}
              onClick={() => goToTab("settings")}
            >
              Learn more
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>

        <div className={styles.vendorDashboardBannerVisual} aria-hidden="true">
          <img src={Ben} alt="" className={styles.vendorDashboardBannerVisualImage} />
        </div>
      </section>

      <section className={styles.vendorDashboardSection}>
        <p className={`mx ${styles.vendorDashboardSectionTitle}`}>Quick Stats</p>

        <div className={styles.vendorDashboardStatsGrid}>
          {stats.map((stat) => (
            <article
              key={stat.title}
              className={`${styles.vendorDashboardCard} ${styles.vendorDashboardCardStat} ${statAccentClasses[stat.accent]}`}
            >
              <div className={styles.vendorDashboardStatTop}>
                <div>
                  <p className={styles.vendorDashboardStatTitle}>{stat.title}</p>
                  {dashboardLoading ? (
                    <LoadingBlock width="120px" height={30} style={{ marginTop: 6 }} />
                  ) : (
                    <h4 className={styles.vendorDashboardStatValue}>{stat.value}</h4>
                  )}
                </div>

                <div className={styles.vendorDashboardStatIcon}>
                  <FontAwesomeIcon icon={stat.icon} />
                </div>
              </div>

              {dashboardLoading ? (
                <LoadingBlock width="150px" height={14} />
              ) : (
                <p className={styles.vendorDashboardStatMeta}>{stat.meta}</p>
              )}
            </article>
          ))}
        </div>
      </section>

      {errorMessage ? (
        <section className={styles.vendorDashboardSection}>
          <article className={`${styles.vendorDashboardCard} ${styles.vendorDashboardPanel}`}>
            <div className={styles.vendorDashboardEmptyState}>
              <span className={styles.vendorDashboardEmptyIcon}>
                <FontAwesomeIcon icon={faBoxOpen} />
              </span>
              <h4>Unable to load dashboard data</h4>
              <p>{errorMessage}</p>
            </div>
          </article>
        </section>
      ) : null}

      <section className={styles.vendorDashboardSection}>
        <article className={`${styles.vendorDashboardCard} ${styles.vendorDashboardPanel}`}>
          <div className={styles.vendorDashboardPanelHeader}>
            <div>
              <h3>Recent Orders</h3>
              <p>Latest orders from your store</p>
            </div>
          </div>

          <div className={styles.vendorDashboardProductTableWrap}>
            <table className={styles.vendorDashboardProductTable}>
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Order Status</th>
                  <th>Payment Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {dashboardLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <tr key={`recent-order-loading-${index}`}>
                      <td>
                        <LoadingBlock width="140px" height={16} />
                      </td>
                      <td>
                        <LoadingBlock width="130px" height={16} />
                      </td>
                      <td>
                        <LoadingBlock width="95px" height={16} />
                      </td>
                      <td>
                        <LoadingBlock width="88px" height={30} />
                      </td>
                      <td>
                        <LoadingBlock width="88px" height={30} />
                      </td>
                      <td>
                        <LoadingBlock width="110px" height={16} />
                      </td>
                    </tr>
                  ))
                ) : errorMessage ? (
                  <tr>
                    <td colSpan="6" className={styles.vendorDashboardProductEmpty}>
                      Unable to load recent orders.
                    </td>
                  </tr>
                ) : recentOrders.length ? (
                  recentOrders.map((order) => (
                    <tr key={order?.id || order?.order_number}>
                      <td>{order?.order_number || "--"}</td>
                      <td>{order?.customer_name || "--"}</td>
                      <td>{formatCurrency(order?.total)}</td>
                      <td>
                        <span
                          style={getStatusBadgeStyle(orderStatusColors, order?.status)}
                        >
                          {formatStatusLabel(order?.status)}
                        </span>
                      </td>
                      <td>
                        <span
                          style={getStatusBadgeStyle(
                            paymentStatusColors,
                            order?.payment_status
                          )}
                        >
                          {formatStatusLabel(order?.payment_status)}
                        </span>
                      </td>
                      <td>{formatDate(order?.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className={styles.vendorDashboardProductEmpty}>
                      No recent orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className={styles.vendorDashboardBottomGrid}>
        <article className={`${styles.vendorDashboardCard} ${styles.vendorDashboardPanel}`}>
          <div className={styles.vendorDashboardPanelHeader}>
            <div>
              <h3>Top Performing Products</h3>
              <p>Best-selling products from orders</p>
            </div>
          </div>

          <div className={styles.vendorDashboardProductTableWrap}>
            <table className={styles.vendorDashboardProductTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProductsLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <tr key={`top-product-loading-${index}`}>
                      <td>
                        <LoadingBlock width="20px" height={16} />
                      </td>
                      <td>
                        <LoadingBlock width="140px" height={16} />
                      </td>
                      <td>
                        <LoadingBlock width="80px" height={16} />
                      </td>
                      <td>
                        <LoadingBlock width="110px" height={16} />
                      </td>
                    </tr>
                  ))
                ) : topProductsError ? (
                  <tr>
                    <td colSpan="4" className={styles.vendorDashboardProductEmpty}>
                      {topProductsError}
                    </td>
                  </tr>
                ) : topProducts.length ? (
                  topProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.rank}</td>
                      <td>{product.name}</td>
                      <td>{product.unitsSold}</td>
                      <td>{product.revenue}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className={styles.vendorDashboardProductEmpty}>
                      No top performing products yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article
          className={`${styles.vendorDashboardCard} ${styles.vendorDashboardPanel} ${styles.vendorDashboardPanelActions}`}
        >
          <div className={styles.vendorDashboardPanelHeader}>
            <div>
              <h3>Quick Actions</h3>
            </div>
          </div>

          <div className={styles.vendorDashboardActions}>
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className={`${styles.vendorDashboardAction} ${actionAccentClasses[action.accent]}`}
                onClick={() => goToTab(action.tab)}
              >
                <span className={styles.vendorDashboardActionIcon}>
                  <FontAwesomeIcon icon={action.icon} />
                </span>
                <span>{action.label}</span>
                <FontAwesomeIcon icon={faPlus} className={styles.vendorDashboardActionPlus} />
              </button>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};

export default Home;
