import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../../../styles/Sidebar.module.css";

const Sidebar = ({ setIsAuthenticated, isCollapsed, setIsCollapsed }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:3000/auth/logout",
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("loggedInUser");
      setIsAuthenticated(false);
      setShowConfirm(false);
      navigate("/login");
    }
  };

  return (
    <>
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
        <div className={styles.logo}>
          {!isCollapsed && <h2 className={styles.logoText}>AttendanceSys</h2>}
          <button
            className={styles.toggleBtn}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? "→" : "←"}
          </button>
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => isActive ? styles.activeLink : styles.link}
          >
            <span>🏠</span>
            {!isCollapsed && "Dashboard"}
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) => isActive ? styles.activeLink : styles.link}
          >
            <span>📅</span>
            {!isCollapsed && "Attendance History"}
          </NavLink>
        </nav>

        <div className={styles.footer}>
          {/* Opens modal instead of logging out directly */}
          <button className={styles.logoutBtn} onClick={() => setShowConfirm(true)}>
            <span>🚪</span>
            {!isCollapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Confirm Logout</h3>
            <p className={styles.modalText}>Are you sure you want to logout?</p>
            <div className={styles.modalButtons}>
              <button
                className={styles.confirmBtn}
                onClick={handleLogout}
              >
                Yes, Logout
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;