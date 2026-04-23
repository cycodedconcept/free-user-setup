import React, { useEffect, useState } from "react";
import Sidebar from "../sidebar/Sidebar";
import Topbar from "./Topbar";
import MainContent from "./MainContent";
import {
  faHome,
  faBoxes,
  faStore,
  faHandshake,
  faCalendarAlt,
  faReceipt,
  faUsers,
  faTruck,
  faUserShield,
  faCog,
  faGlobe
} from "@fortawesome/free-solid-svg-icons";

const VENDOR_ACTIVE_TAB_KEY = "mycroshop.vendorActiveTab";

// Updated sidebar buttons to match the new comprehensive sidebar
const sidebarButtons = [
    {
      label: "Dashboard",
      key: "dashboard",
      icon: faHome,
      visible: true,
    },
    {
      label: "Inventory",
      key: "inventory",
      icon: faBoxes,
      visible: true,
      hasSubmenu: true,
      submenu: [
        { label: "Products", key: "products" },
        { label: "Category", key: "category" },
        { label: "Sales", key: "sales" },
        { label: "Stock Audit", key: "stock-audit" },
        { label: "Activity Log", key: "activity-log" },
      ]
    },
    {
      label: "Online Store",
      key: "online-store",
      icon: faStore,
      visible: true,
    },
    {
      label: "Manage Online Store",
      key: "manage-online-store",
      icon: faStore,
      visible: false,
      hasSubmenu: false,
      submenu: [
        { label: "Manage Store", key: "manage-store" },
        { label: "Set Up Store", key: "set-up-store" },
        { label: "Payment Methods", key: "payment-methods" },
      ]
    },
    {
      label: "Buying Pool",
      key: "buying-pool",
      icon: faHandshake,
      visible: true,
    },
    {
      label: "Bookings",
      key: "bookings",
      icon: faCalendarAlt,
      visible: true,
      hasSubmenu: true,
      submenu: [
        { label: "Manage Bookings", key: "manage-bookings" },
        { label: "Calendar", key: "calendar" },
        { label: "Settings", key: "settings" },
      ]
    },
    {
      label: "Invoices",
      key: "invoices",
      icon: faReceipt,
      visible: true,
    },
    {
      label: "Orders",
      key: "orders",
      icon: faReceipt,
      visible: true,
    },
    {
      label: "CRM",
      key: "crm",
      icon: faUsers,
      visible: true,
      hasSubmenu: true,
      submenu: [
        { label: "My Customers", key: "my-customers" },
        { label: "AI Assistant", key: "ai-assistant" },
        { label: "Orders", key: "orders" },
        { label: "Marketing", key: "marketing" },
        { label: "Birthdays", key: "birthdays" },
        { label: "Return Audit", key: "return-audit" },
      ]
    },
    {
      label: "Logistics",
      key: "logistics",
      icon: faTruck,
      visible: true,
    },
    {
      label: "Admin Users",
      key: "admin-users",
      icon: faUserShield,
      visible: true,
    },
    {
      label: "Settings",
      key: "settings",
      icon: faCog,
      visible: true,
    },
    {
      label: "Domains",
      key: "domains",
      icon: faGlobe,
      visible: true,
    },
  ];

const OnlineStore = () => {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === "undefined") return "dashboard";
    try {
      return localStorage.getItem(VENDOR_ACTIVE_TAB_KEY) || "dashboard";
    } catch {
      return "dashboard";
    }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(VENDOR_ACTIVE_TAB_KEY, activeTab);
    } catch {
      // Ignore storage errors
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isSidebarOpen || typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSidebarOpen]);

  // Helper function to get the current page info for topbar
  const getCurrentPageInfo = (activeTab) => {
    // Check if it's a main menu item
    const mainItem = sidebarButtons.find(btn => btn.key === activeTab);
    if (mainItem) {
      return {
        label: mainItem.label,
        key: mainItem.key,
        icon: mainItem.icon
      };
    }

    // Check if it's a submenu item (format: "parent-key-submenu-key")
    for (const button of sidebarButtons) {
      if (button.hasSubmenu) {
        for (const subItem of button.submenu) {
          const fullKey = `${button.key}-${subItem.key}`;
          if (fullKey === activeTab) {
            return {
              label: subItem.label,
              key: fullKey,
              icon: button.icon, // Use parent icon
              parentLabel: button.label // Add parent context
            };
          }
        }
      }
    }

    // Fallback for special cases or unknown keys
    const specialCases = {
      "create-invoice": { label: "Create Invoice", icon: faReceipt },
      "manage-store": { label: "Manage Store", icon: faStore }, // Backward compatibility
      "invoice": { label: "Invoices", icon: faReceipt }, // Backward compatibility
    };

    if (specialCases[activeTab]) {
      return specialCases[activeTab];
    }

    // Default fallback
    return {
      label: "Unknown Page",
      key: activeTab,
      icon: faHome
    };
  };

  const currentPageInfo = getCurrentPageInfo(activeTab);
  return (
    <div
      className="vendor-layout d-flex overflow-hidden vh-100"
      style={{ background: "var(--app-bg)", color: "var(--app-text)" }}
    >
      <button
        className={`vendor-sidebar-overlay ${isSidebarOpen ? "vendor-sidebar-overlay-open" : ""}`}
        type="button"
        aria-label="Close sidebar"
        onClick={() => setIsSidebarOpen(false)}
      />
      <div
        className={`sidebar-container vendor-sidebar-container flex-shrink-0 ${
          isSidebarOpen ? "vendor-sidebar-container-open" : ""
        }`}
        style={{ width: "250px", height: "100vh", background: "var(--app-surface)" }}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setIsSidebarOpen(false)}
          onNavigate={() => setIsSidebarOpen(false)}
        />
      </div>
      <div className="main-container flex-grow-1 d-flex flex-column">
        <div
          className="position-sticky top-0"
          style={{
            zIndex: 1000,
            background: "var(--app-surface)",
            borderBottom: "1px solid var(--app-border)",
            boxShadow: "var(--app-shadow-soft)",
          }}
        >
          <Topbar 
            activeTab={activeTab} 
            sidebarButtons={sidebarButtons}
            currentPageInfo={currentPageInfo}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
        </div>
        <div className="flex-grow-1 position-relative">
          <div className="position-absolute w-100 h-100 overflow-y-auto overflow-x-hidden will-change-transform">
            <MainContent activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineStore;
