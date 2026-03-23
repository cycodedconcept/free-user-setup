import React from "react";
import ManageStore from "./ManageStore";
import SetupStoreMain from "./SetupStoreMain";
import AllInvoices from "../invoice/AllInvoices";
import Orders from "../orders/Orders";
import GeneralSettings from "../settings/GeneralSettings";
import Home from "../dashboard/Home";
import Domain from "../domain/Domain";
import Product from "../product/Product";

const MainContent = ({ activeTab, setActiveTab }) => {
  const noPaddingTabs = ["crm-ai-assistant"];
  return (
    <>
      <div className={!noPaddingTabs.includes(activeTab) ? "p-4" : ""}>
        {/* Home Page */}
        {activeTab === "dashboard" && (
          <Home setActiveTab={setActiveTab} />
        )}

        
        
        {/* Manage Online Store Submenu Items */}
        {activeTab === "manage-online-store-manage-store" && (
          <ManageStore setActiveTab={setActiveTab} />
        )}
        {activeTab === "online-store" && (
          <SetupStoreMain setActiveTab={setActiveTab} />
        )}
        {activeTab === "products" && (
          <Product setActiveTab={setActiveTab} />
        )}
        {activeTab === "orders" && (
          <Orders setActiveTab={setActiveTab} />
        )}
        {activeTab === "manage-online-store-payment-methods" && (
          <Payment setActiveTab={setActiveTab} />
        )}

        {/* Setup Online Store (standalone) */}
        {activeTab === "setup-online-store" && (
          <SetupStore setActiveTab={setActiveTab} />
        )}

        {/* Invoices */}
        {activeTab === "invoices" && <AllInvoices setActiveTab={setActiveTab} />}


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
          <GeneralSettings setActiveTab={setActiveTab} />
        )}

        {/* Domains */}
        {activeTab === "domains" && (
          <Domain setActiveTab={setActiveTab} />
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
