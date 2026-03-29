import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../../../styles/Navbar.module.css";

const Navbar = ({ title = "Dashboard", setIsAuthenticated }) => {
  // ← fixed localStorage key
  const teacher = JSON.parse(localStorage.getItem("loggedInUser"));
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      navigate("/login");
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
              Profile
            </button>
            {/* ← logout now works */}
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