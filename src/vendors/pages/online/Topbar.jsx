import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faStore, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import '../sidebar/sidebar.css';
import styles from "../../../styles.module.css";
import Swal from 'sweetalert2';


const Topbar = ({ activeTab, sidebarButtons }) => {
const navigate = useNavigate();
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
        className="topbar d-flex justify-content-between align-items-center px-4 py-3"
        style={{
          background: "var(--app-surface)",
          color: "var(--app-text)",
          borderBottom: "1px solid var(--app-border)",
        }}
      >
          <div>
              <h6 className="m-0" style={{color: 'var(--app-primary)'}}>{activeLabel}</h6>
          </div>
          <div className="d-flex align-items-center gap-4">
              <button className={`${styles.topBtn} p-2 mx`}><FontAwesomeIcon icon={faStore} /><span className="mx-2">Chuks Electronic Store</span> <FontAwesomeIcon icon={faChevronDown} style={{color: 'var(--app-text-muted)', fontSize: '14px'}}/></button>
              <div style={{ position: 'relative', display: 'inline-block' }}>
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
              </div>
              <span className="mx d-block px-4" style={{borderLeft: '2px solid var(--app-border)', color: 'var(--app-text)', cursor: 'pointer'}} onClick={logOut}>Log Out</span>
          </div>

      </div>
    </>
  )
}

export default Topbar
