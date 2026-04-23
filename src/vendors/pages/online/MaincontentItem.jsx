import React from 'react'
import ManageStore from "./ManageStore";
import styles from "../../../styles.module.css";

const MaincontentItem = ({ activeTab, setActiveTab }) => {
  const noPaddingTabs = ["crm-ai-assistant"];
  return (
    <>
      <div className={`${!noPaddingTabs.includes(activeTab) ? "p-4" : ""} ${styles.vendorOnlineContent}`}>
        
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
