import { useState } from "react";
import styles from "../../styles/Login.module.css";
import axios from "axios";
import { handleSuccess, handleError } from "../../utils/utils.js";
import { ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Login = ({ setIsAuthenticated }) => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [loginInfo, setLoginInfo] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginInfo({ ...loginInfo, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { email, password } = loginInfo;
    if (!email || !password) {
      return handleError("Please fill all fields");
    }

    try {
      const url = "http://localhost:3000/auth/login";
      const response = await axios.post(url, loginInfo, {
        withCredentials: true  // needed to receive the httpOnly cookie
      });

      const { success, message, teacher } = response.data;

      if (success) {
        localStorage.setItem("loggedInUser", JSON.stringify(teacher)); // save user info
        setIsAuthenticated(true);
        handleSuccess(message);
        setTimeout(() => navigate("/dashboard"), 1000);
      }
    } catch (error) {
      handleError(
        error.response?.data?.message ||
        "Login failed. Please try again."
      );
    }
  };

  return (
    <div className={styles.page}>
      {/* Left Panel */}
      <div className={styles.leftPanel}>
        <div className={styles.brandWrapper}>
          <h1 className={styles.brandName}>AttendanceSys</h1>
          <p className={styles.brandTagline}>
            Smart attendance tracking for modern classrooms.
          </p>
        </div>
        <div className={styles.decoration} />
      </div>

      {/* Right Panel */}
      <div className={styles.rightPanel}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.title}>Welcome back</h2>
            <p className={styles.subtitle}>Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Email address</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                className={styles.input}
                placeholder="you@example.com"
                value={loginInfo.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Password</label>
                <a href="#" className={styles.forgotLink}>Forgot password?</a>
              </div>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  className={styles.input}
                  placeholder="••••••••"
                  value={loginInfo.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn}>Login</button>
          </form>

          <ToastContainer />
        </div>
      </div>
    </div>
  );
};

export default Login;