import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axiosInstance from "../../../services/axiosInstance.js";
import { clearStoredUser, getStoredUser } from "../../../utils/auth.js";
import styles from "../../../styles/Sidebar.module.css";

const Sidebar = ({ setAuthState, isCollapsed, setIsCollapsed }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const isAdmin = currentUser?.role === "admin";
  const navItems = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/history", label: "Attendance History" },
  ];

  if (isAdmin) {
    navItems.push({ to: "/admin", label: "Admin Upload" });
  }

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearStoredUser();
      setAuthState({
        isAuthenticated: false,
        user: null,
        isReady: true,
      });
      setShowConfirm(false);
      navigate("/login", { replace: true });
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
            {isCollapsed ? ">" : "<"}
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => isActive ? styles.activeLink : styles.link}
            >
              {!isCollapsed && <span className={styles.linkText}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <button className={styles.logoutBtn} onClick={() => setShowConfirm(true)}>
            {!isCollapsed && <span className={styles.linkText}>Logout</span>}
          </button>
        </div>
      </aside>

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
