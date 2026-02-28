import React, { useState, useEffect } from "react";
import { FaBars } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import { Logo, El } from "../../../assets";
import "./sidebar.css";

const SidebarStore = ({ activeTab, setActiveTab }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const [userName, setUserName] = useState('')

  const toggleExpanded = (key) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getName = () => {
    let getValue = localStorage.getItem('user');
    let myValue = JSON.parse(getValue);
    setUserName(myValue.tenantName)
  }

  useEffect(() => {
    getName();
  }, [])



  const sidebarButtons = [
    {
      label: "Online Store",
      key: "online-store",
      icon: faStore,
      visible: true,
    }
  ];

  const handleItemClick = (btn) => {
    if (btn.hasSubmenu) {
      toggleExpanded(btn.key);
    } else {
      setActiveTab(btn.key);
    }
  };

  const handleSubmenuClick = (parentKey, submenuKey) => {
    setActiveTab(`${parentKey}-${submenuKey}`);
  };

  const isActiveParent = (btn) => {
    if (btn.hasSubmenu) {
      return btn.submenu.some(sub => activeTab === `${btn.key}-${sub.key}`);
    }
    return activeTab === btn.key;
  };

  return (
    <>
      <div className="sidebar d-flex flex-column p-3 bg-white shadow-sm" style={{ minHeight: "100vh", overflowY: "auto" }}>
        {/* Logo Section */}
        <div className="d-flex align-items-center mb-4 justify-content-between">
          <img src={Logo} alt="" className="w-50" />
          <FaBars className="mr-2" style={{ cursor: "pointer" }} />
        </div>

        {/* Profile Section */}
        <div className="profile mb-3" style={{ borderBottom: "1px solid #FAFAFA", paddingBottom: "15px" }}>
          <div className="d-flex align-items-center" style={{ cursor: "pointer" }}>
            <img src={El} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
            <span className="mx-2" style={{ fontSize: "14px", fontWeight: "500" }}>{userName}</span>
            <FontAwesomeIcon icon={faChevronDown} style={{ marginLeft: "auto", fontSize: "12px" }} />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-grow-1">
          {sidebarButtons
            .filter((btn) => btn.visible)
            .map((btn, index) => (
              <div key={index} className="nav-item">
                {/* Main Navigation Button */}
                <button
                  onClick={() => handleItemClick(btn)}
                  className="btn d-flex align-items-center justify-content-between w-100 text-left p-2 mb-3"
                  style={{
                    color: isActiveParent(btn) ? "#0273F9" : "#6C7293",
                    background: isActiveParent(btn) ? "#EAF4FF" : "transparent",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: isActiveParent(btn) ? "600" : "400",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActiveParent(btn)) {
                      e.target.style.background = "#F8F9FA";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActiveParent(btn)) {
                      e.target.style.background = "transparent";
                    }
                  }}
                >
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon
                      icon={btn.icon}
                      style={{
                        color: isActiveParent(btn) ? "#0273F9" : "#6C7293",
                        width: "16px",
                        marginRight: "12px",
                      }}
                    />
                    <span>{btn.label}</span>
                  </div>
                  {btn.hasSubmenu && (
                    <FontAwesomeIcon
                      icon={expandedItems[btn.key] ? faChevronDown : faChevronRight}
                      style={{
                        fontSize: "12px",
                        color: isActiveParent(btn) ? "#0273F9" : "#6C7293",
                        transition: "transform 0.2s ease",
                        marginLeft: "auto",
                      }}
                    />
                  )}
                </button>

                {/* Submenu */}
                {btn.hasSubmenu && expandedItems[btn.key] && (
                  <div className="submenu ml-4 mb-2">
                    {btn.submenu.map((subItem, subIndex) => (
                      <button
                        key={subIndex}
                        onClick={() => handleSubmenuClick(btn.key, subItem.key)}
                        className="btn d-flex align-items-center w-100 text-left p-2 mb-3"
                        style={{
                          color: activeTab === `${btn.key}-${subItem.key}` ? "#0273F9" : "#8A92A5",
                          background: activeTab === `${btn.key}-${subItem.key}` ? "#EAF4FF" : "transparent",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: activeTab === `${btn.key}-${subItem.key}` ? "500" : "400",
                          marginLeft: "20px",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (activeTab !== `${btn.key}-${subItem.key}`) {
                            e.target.style.background = "#F8F9FA";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeTab !== `${btn.key}-${subItem.key}`) {
                            e.target.style.background = "transparent";
                          }
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: activeTab === `${btn.key}-${subItem.key}` ? "#0273F9" : "#C4C4C4",
                            marginRight: "12px",
                            transition: "background-color 0.2s ease",
                          }}
                        />
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </nav>
      </div>
    </>
  );
};

export default SidebarStore;