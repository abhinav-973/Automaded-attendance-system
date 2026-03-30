import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../services/axiosInstance.js";
import { clearStoredUser, getStoredUser } from "../../../utils/auth.js";
import styles from "../../../styles/Navbar.module.css";

const Navbar = ({ title = "Dashboard", setAuthState }) => {
  const teacher = getStoredUser();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.leftSection}>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.rightSection} ref={dropdownRef}>
        <div
          className={styles.profile}
          onClick={() => setOpen(!open)}
        >
          <div className={styles.avatar}>
            {teacher?.name?.charAt(0).toUpperCase()}
          </div>
          <span className={styles.name}>
            {teacher?.name}
          </span>
        </div>

        {open && (
          <div className={styles.dropdown}>
            <button className={styles.dropdownItem}>
              {teacher?.role === "admin" ? "Admin" : "Teacher"}
            </button>
            <button
              className={styles.dropdownItem}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
