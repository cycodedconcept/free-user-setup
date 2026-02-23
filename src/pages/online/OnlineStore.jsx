import React, { useState } from "react";
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
} from "@fortawesome/free-solid-svg-icons";
import styles from "../../styles.module.css";

// Updated sidebar buttons to match the new comprehensive sidebar
const sidebarButtons = [
    {
      label: "Home",
      key: "home",
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
      label: "Manage Online Store",
      key: "manage-online-store",
      icon: faStore,
      visible: true,
      hasSubmenu: true,
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
  ];

const OnlineStore = () => {
  // Set initial active tab to match the new sidebar structure
  const [activeTab, setActiveTab] = useState("home");

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

  // Create a flattened buttons array for topbar that includes submenu items
  const getFlattenedButtons = () => {
    const flattened = [];
    
    sidebarButtons.forEach(button => {
      // Add main button
      flattened.push(button);
      
      // Add submenu items with full keys
      if (button.hasSubmenu) {
        button.submenu.forEach(subItem => {
          flattened.push({
            label: subItem.label,
            key: `${button.key}-${subItem.key}`,
            icon: button.icon,
            visible: true,
            parentLabel: button.label
          });
        });
      }
    });

    // Add special cases
    flattened.push({
      label: "Create Invoice",
      key: "create-invoice",
      icon: faReceipt,
      visible: true
    });

    return flattened;
  };

  const currentPageInfo = getCurrentPageInfo(activeTab);
  const flattenedButtons = getFlattenedButtons();

  return (
    <div
      className="d-flex overflow-hidden vh-100"
      style={{ background: "#FAFAFA" }}
    >
      <div
        className="sidebar-container bg-light d-none d-lg-block flex-shrink-0"
        style={{ width: "250px", height: "100vh" }}
      >
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <div className="main-container flex-grow-1 d-flex flex-column">
        <div
          className="position-sticky top-0 bg-white shadow-sm"
          style={{ zIndex: 1000 }}
        >
          <Topbar 
            activeTab={activeTab} 
            sidebarButtons={sidebarButtons}
            currentPageInfo={currentPageInfo}
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