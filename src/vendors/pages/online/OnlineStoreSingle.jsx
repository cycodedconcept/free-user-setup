import React, { useState } from "react";
import SidebarStore from "../sidebar/SidebarStore";
import Topbar from "./Topbar";
import MaincontentItem from "./MaincontentItem";
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
import styles from "../../../styles.module.css";

// Updated sidebar buttons to match the new comprehensive sidebar
const sidebarButtons = [
  {
    label: "Online Store",
    key: "online-store",
    icon: faStore,
    visible: true,
  }
];

const OnlineStoreSingle = () => {
  // Set initial active tab to match the new sidebar structure
  const [activeTab, setActiveTab] = useState("online-store");

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
        <SidebarStore activeTab={activeTab} setActiveTab={setActiveTab} />
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
            <MaincontentItem activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineStoreSingle;