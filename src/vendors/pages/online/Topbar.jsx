import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faStore, faChevronDown, faBars, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import '../sidebar/sidebar.css';
import styles from "../../../styles.module.css";
import Swal from 'sweetalert2';


const Topbar = ({ activeTab, sidebarButtons, onMenuClick }) => {
const navigate = useNavigate();
const storeName = useSelector((state) => state.store?.myStore?.onlineStore?.store_name);
let activeLabel = "Dashboard";

for (const btn of sidebarButtons) {
  if (btn.key === activeTab) {
    activeLabel = btn.label;
    break;
  }

  if (btn.submenu && btn.submenu.length > 0) {
    const foundSub = btn.submenu.find(
      (sub) =>
        activeTab === `${btn.key}-${sub.key}` || activeTab === sub.key
    );
    if (foundSub) {
      activeLabel = foundSub.label;
      break;
    }
  }
}

  const logOut = () => {
  Swal.fire({
    title: "Are you sure?",
    text: "You will be logged out of your account",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, log out",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.clear();
      navigate("/vendor/login");
    }
  });
};


  return (
    <>
      <div
        className="topbar vendor-topbar"
        style={{
          background: "var(--app-surface)",
          color: "var(--app-text)",
          borderBottom: "1px solid var(--app-border)",
        }}
      >
          <div className="vendor-topbar-titleGroup">
              {onMenuClick ? (
                <button
                  className="vendor-topbar-menu"
                  type="button"
                  aria-label="Open sidebar"
                  onClick={onMenuClick}
                >
                  <FontAwesomeIcon icon={faBars} />
                </button>
              ) : null}
              <h6 className="m-0 vendor-topbar-title" style={{color: 'var(--app-primary)'}}>{activeLabel}</h6>
          </div>
          <div className="vendor-topbar-actions">
              <button className={`${styles.topBtn} vendor-topbar-storeButton`} type="button" style={{color: 'var(--app-primary)'}}><FontAwesomeIcon icon={faStore} style={{color: 'var(--app-primary)'}} /><span style={{color: 'var(--app-primary)'}}>{storeName || "My Store"}</span> <FontAwesomeIcon icon={faChevronDown} style={{color: 'var(--app-primary)', fontSize: '14px'}}/></button>
              <button className="vendor-topbar-iconButton" type="button" aria-label="Notifications">
                  <FontAwesomeIcon icon={faBell} size="lg" style={{ color: 'var(--app-text)' }} />

                  <span style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-8px',
                      backgroundColor: 'red',
                      color: 'white',
                      borderRadius: '50%',
                      padding: '2px 6px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      lineHeight: 1,
                  }}>
                      0
                  </span>
              </button>
              <button className="vendor-topbar-logout" type="button" onClick={logOut}>
                <FontAwesomeIcon className="vendor-topbar-logoutIcon" icon={faRightFromBracket} />
                <span>Log Out</span>
              </button>
          </div>

      </div>
    </>
  )
}

export default Topbar
