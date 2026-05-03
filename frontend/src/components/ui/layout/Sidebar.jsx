import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axiosInstance from "../../../services/axiosInstance.js";
import { clearStoredUser, getStoredUser } from "../../../utils/auth.js";
import styles from "../../../styles/Sidebar.module.css";
import { 
  LayoutDashboard, 
  History, 
  ShieldCheck, 
  LogOut, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";

const Sidebar = ({ setAuthState, isCollapsed, setIsCollapsed }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const isAdmin = currentUser?.role === "admin";

  // Using Lucide components directly in the config array
  const navItems = [
    { to: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
    { to: "/history", label: "Attendance History", shortLabel: "History", icon: History },
  ];

  if (isAdmin) {
    navItems.push({ to: "/admin", label: "Admin Panel", shortLabel: "Admin", icon: ShieldCheck });
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
      {/* Desktop Glass Sidebar */}
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : styles.expanded}`}>
        <div className={styles.header}>
          <div className={`${styles.logoWrapper} ${isCollapsed ? "justify-center" : "justify-between"}`}>
            {!isCollapsed && (
              <h2 className={styles.logoText}>
                Attendance<span className="text-blue-500">Sys</span>
              </h2>
            )}
            <button
              className={styles.toggleBtn}
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label="Toggle Sidebar"
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
                title={isCollapsed ? item.label : ""}
              >
                <span className={styles.linkIcon}><Icon size={20} /></span>
                {!isCollapsed && <span className={styles.linkText}>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <button 
            className={styles.logoutBtn} 
            onClick={() => setShowConfirm(true)}
            title={isCollapsed ? "Logout" : ""}
          >
            <span className={styles.linkIcon}><LogOut size={20} /></span>
            {!isCollapsed && <span className={styles.linkText}>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Floating Glass Dock */}
      <nav className={styles.mobileNav} aria-label="Mobile navigation">
        <div className={styles.mobileNavContainer}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ""}`
                }
              >
                <div className={styles.mobileIconWrapper}>
                  <Icon size={22} />
                </div>
                <span className={styles.mobileNavText}>{item.shortLabel}</span>
              </NavLink>
            );
          })}
          
          {/* Logout on Mobile Dock */}
          <button 
            className={`${styles.mobileNavItem} text-rose-500`}
            onClick={() => setShowConfirm(true)}
          >
            <div className={styles.mobileIconWrapper}>
              <LogOut size={22} />
            </div>
            <span className={styles.mobileNavText}>Logout</span>
          </button>
        </div>
      </nav>

      {/* Glassmorphism Logout Modal */}
      {showConfirm && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalIconBox}>
              <LogOut size={28} className="text-rose-500" />
            </div>
            <h3 className={styles.modalTitle}>Sign Out</h3>
            <p className={styles.modalText}>
              Are you sure you want to end your session and sign out of your account?
            </p>
            <div className={styles.modalButtons}>
              <button className={styles.confirmBtn} onClick={handleLogout}>
                Yes, Sign Out
              </button>
              <button className={styles.cancelBtn} onClick={() => setShowConfirm(false)}>
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