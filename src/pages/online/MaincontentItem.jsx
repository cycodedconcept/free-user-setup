import React from 'react'
import ManageStore from "./ManageStore";
import SetupStore from "./SetupStore";

const MaincontentItem = ({ activeTab, setActiveTab }) => {
  const noPaddingTabs = ["crm-ai-assistant"];
  return (
    <>
      <div className={!noPaddingTabs.includes(activeTab) ? "p-4" : ""}>
        
        {/* Manage Online Store Submenu Items */}
        {activeTab === "online-store" && (
          <ManageStore setActiveTab={setActiveTab} />
        )}
        {/*  */}
      </div>
    </>
  );
}

export default MaincontentItem