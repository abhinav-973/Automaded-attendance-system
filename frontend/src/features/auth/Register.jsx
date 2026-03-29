import { useState } from "react";
import styles from "../../styles/Login.module.css";
import axios from "axios";
import { handleSuccess, handleError } from "../../utils/utils.js";
import { ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [registerInfo, setRegisterInfo] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRegisterInfo({ ...registerInfo, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, password } = registerInfo;
    if (!name || !email || !password) {
      return handleError("Please fill all fields");
    }

    try {
      const url = "http://localhost:3000/auth/register";
      const response = await axios.post(url, registerInfo);

      const { success, message } = response.data;

      if (success) {
        handleSuccess(message);
        setTimeout(() => navigate("/login"), 1000);
      }
    } catch (error) {
      handleError(
        error.response?.data?.message ||
        "Registration failed. Please try again."
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
            <h2 className={styles.title}>Create an account</h2>
            <p className={styles.subtitle}>Register to get started</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Name</label>
              <input
                type="text"
                name="name"
                autoComplete="name"
                className={styles.input}
                placeholder="your name"
                value={registerInfo.name}
                onChange={handleChange}
                required
              />

              <label className={styles.label}>Email address</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                className={styles.input}
                placeholder="you@example.com"
                value={registerInfo.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Password</label>
              </div>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  className={styles.input}
                  placeholder="••••••••"
                  value={registerInfo.password}
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

            <button type="submit" className={styles.submitBtn}>Register</button>
          </form>

          <ToastContainer />
        </div>
      </div>
    </div>
  );
};

export default Register;