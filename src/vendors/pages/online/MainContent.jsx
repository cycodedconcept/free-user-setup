import React from "react";
import ManageStore from "./ManageStore";
import SetupStoreMain from "./SetupStoreMain";
import AllInvoices from "../invoice/AllInvoices";
// import ManageBookings from "../Bookings/ManageBookings"
// import Calendar from "../Bookings/Calendar";
// import Settings from "../Bookings/Settings";
// import BuyingPool from "../Pool/BuyingPool";
// import Logistics from "../logistics/Logistics";
// import ProductInventory from "../inventory/ProductInventory";
// import ManageCategory from "../inventory/ManageCategory";
// import Sales from "../inventory/Sales";
// import StockAudit from "../inventory/StockAudit";
// import ActivityHistory from "../inventory/ActivityHistory";
import Customers from "../crm/Customers";
import Orders from "../crm/Orders";
import Marketing from "../crm/Marketing";
import Birthdays from "../crm/Birthdays";
import ReturnAudit from "../crm/ReturnAudit";
import Ai from "../crm/Ai";
// import Payment from "../payment/Payment";

const MainContent = ({ activeTab, setActiveTab }) => {
  const noPaddingTabs = ["crm-ai-assistant"];
  return (
    <>
      <div className={!noPaddingTabs.includes(activeTab) ? "p-4" : ""}>
        {/* Home Page */}
        {activeTab === "home" && (
          <div>
            <h2>Dashboard</h2>
            <p>Welcome to your dashboard!</p>
            {/* Add your home/dashboard component here */}
          </div>
        )}

        {/* Inventory Section */}
        {activeTab === "inventory-products" && (
          <ProductInventory setActiveTab={setActiveTab} />
        )}
        
        {activeTab === "inventory-category" && (
          <ManageCategory setActiveTab={setActiveTab}/>
        )}
        {activeTab === "inventory-sales" && (
          <Sales setActiveTab={setActiveTab}/>
        )}
        {activeTab === "inventory-stock-audit" && (
          <StockAudit setActiveTab={setActiveTab}/>
        )}
        {activeTab === "inventory-activity-log" && (
          <ActivityHistory setActiveTab={setActiveTab}/>
        )}

        {/* Manage Online Store Section - Main parent */}
        {activeTab === "manage-online-store" && (
          <div>
            <h2>Manage Online Store</h2>
            <p>Select a submenu option to get started</p>
            {/* This shows when the main item is clicked without submenu */}
          </div>
        )}
        
        {/* Manage Online Store Submenu Items */}
        {activeTab === "manage-online-store-manage-store" && (
          <ManageStore setActiveTab={setActiveTab} />
        )}
        {activeTab === "online-store" && (
          <SetupStoreMain setActiveTab={setActiveTab} />
        )}
        {activeTab === "manage-online-store-payment-methods" && (
          <Payment setActiveTab={setActiveTab} />
        )}

        {/* Setup Online Store (standalone) */}
        {activeTab === "setup-online-store" && (
          <SetupStore setActiveTab={setActiveTab} />
        )}

        {/* Buying Pool */}
        {activeTab === "buying-pool" && (
          <BuyingPool setActiveTab={setActiveTab} />
        )}

        {/* Bookings Section */}
        {activeTab === "bookings-manage-bookings" && (
          <ManageBookings setActiveTab={setActiveTab} />
        )}
        {activeTab === "bookings-settings" && (
          <Settings setActiveTab={setActiveTab} />
        )}
        {activeTab === "bookings-calendar" && (
          <Calendar setActiveTab={setActiveTab} />
        )}

        {/* Invoices */}
        {activeTab === "invoices" && <AllInvoices setActiveTab={setActiveTab} />}

        {/* CRM Section */}
        {activeTab === "crm-my-customers" && (
          <Customers setActiveTab={setActiveTab} />
        )}
        {activeTab === "crm-ai-assistant" && (
          <Ai setActiveTab={setActiveTab} />
        )}
        {activeTab === "crm-orders" && (
          <Orders setActiveTab={setActiveTab} />
        )}
        {activeTab === "crm-marketing" && (
          <Marketing setActiveTab={setActiveTab} />
        )}
        {activeTab === "crm-birthdays" && (
          <Birthdays setActiveTab={setActiveTab} />
        )}
        {activeTab === "crm-return-audit" && (
          <ReturnAudit setActiveTab={setActiveTab} />
        )}

        {/* Logistics */}
        {activeTab === "logistics" && (
          <Logistics setActiveTab={setActiveTab} />
        )}

        {/* Admin Users */}
        {activeTab === "admin-users" && (
          <div>
            <h2>Admin Users</h2>
            <p>Manage admin users and permissions</p>
            {/* Add your admin users component here */}
          </div>
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <div>
            <h2>Settings</h2>
            <p>Application settings</p>
            {/* Add your settings component here */}
          </div>
        )}

        {/* Backward compatibility for old keys */}
        {activeTab === "manage-store" && (
          <ManageStore setActiveTab={setActiveTab} />
        )}
        {activeTab === "invoice" && <Invoice setActiveTab={setActiveTab} />}

        {/* Default fallback */}
        {!activeTab && (
          <div>
            <h2>Welcome</h2>
            <p>Please select a menu item from the sidebar.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default MainContent;