import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faBoxOpen,
  faChevronRight,
  faLightbulb,
  faMoneyBillWave,
  faPlus,
  faShop,
  faStore,
  faBagShopping,
} from "@fortawesome/free-solid-svg-icons";
import styles from "../../../styles.module.css";
import { Hm, Ben } from "../../../assets";
import Button from "../../../components/ui/Button";

const stats = [
  {
    title: "Total Products",
    value: "0",
    meta: "0 different products",
    icon: faBagShopping,
    accent: "green",
  },
  {
    title: "Active Orders",
    value: "0",
    meta: "+0% from last month",
    icon: faBoxOpen,
    accent: "yellow",
  },
  {
    title: "Total Revenue",
    value: "$0.00",
    meta: "+0% from last month",
    icon: faMoneyBillWave,
    accent: "blue",
  },
  {
    title: "Active Products",
    value: "23",
    meta: "Published products",
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

const Home = ({ setActiveTab }) => {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const goToTab = (tab) => {
    if (setActiveTab && tab) {
      setActiveTab(tab);
    }
  };

  const bannerStyle = {
    "--vendor-dashboard-banner-image": `url(${Hm})`,
  };

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

        <div className={styles.vendorDashboardBannerCtaWrap}>
          <Button
            unstyled
            className={styles.vendorDashboardPrimaryBtn}
            onClick={() => goToTab("online-store")}
          >
            Explore More Tips
          </Button>
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
                  <h4 className={styles.vendorDashboardStatValue}>{stat.value}</h4>
                </div>

                <div className={styles.vendorDashboardStatIcon}>
                  <FontAwesomeIcon icon={stat.icon} />
                </div>
              </div>

              <p
                className={`${styles.vendorDashboardStatMeta} ${
                  stat.meta.includes("%") ? styles.vendorDashboardStatMetaPositive : ""
                }`}
              >
                {stat.meta}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.vendorDashboardBottomGrid}>
        <article className={`${styles.vendorDashboardCard} ${styles.vendorDashboardPanel}`}>
          <div className={styles.vendorDashboardPanelHeader}>
            <div>
              <h3>Recent Activities</h3>
              <p>Latest system activities across all modules</p>
            </div>
          </div>

          <div className={styles.vendorDashboardEmptyState}>
            <div className={styles.vendorDashboardEmptyIcon}>
              <FontAwesomeIcon icon={faArrowTrendUp} />
            </div>
            <h4>Activities</h4>
            <p>No information available</p>
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
