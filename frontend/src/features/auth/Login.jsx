import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../../styles/Login.module.css";
import axiosInstance from "../../services/axiosInstance.js";
import { handleSuccess, handleError } from "../../utils/utils.js";
import { setStoredUser } from "../../utils/auth.js";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

const Login = ({ setAuthState }) => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [loginInfo, setLoginInfo] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setLoginInfo({ ...loginInfo, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { email, password } = loginInfo;
    if (!email || !password) {
      return handleError("Please fill all fields");
    }

    setIsLoading(true);

    try {
      const response = await axiosInstance.post("/auth/login", loginInfo);
      const { success, message, teacher, accessToken } = response.data;

      if (success) {
        // ✅ Store accessToken in localStorage (for Authorization header)
        localStorage.setItem("accessToken", accessToken);
        
        // ✅ Store user info
        setStoredUser(teacher);
        
        // ✅ Update auth state
        setAuthState({
          isAuthenticated: true,
          user: teacher,
          isReady: true,
        });
        
        handleSuccess(message);
        setTimeout(() => navigate("/dashboard", { replace: true }), 800);
      }
    } catch (error) {
      handleError(
        error.response?.data?.message || "Login failed. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Left Branding Section */}
      <section className={styles.leftPanel}>
        <div className={styles.leftPanelContent}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={styles.brandWrapper}
          >
            <div className={styles.logoBadge}>
              <ShieldCheck size={28} className="text-blue-400" />
            </div>
            <h1 className={styles.brandName}>AttendanceSys</h1>
            <p className={styles.brandTagline}>
              Experience the next generation of classroom management. Automated, 
              AI-driven tracking designed for modern educators.
            </p>
          </motion.div>

          {/* Premium Abstract Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={styles.featurePreview}
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles size={20} className="text-blue-400" />
              <span className="text-sm font-bold text-slate-300 tracking-wider uppercase">Smart Recognition</span>
            </div>
            <div className={styles.previewLine} />
            <div className={styles.previewLineShort} />
            <div className={styles.previewLineMedium} />
          </motion.div>
        </div>

        {/* Ambient Gradients */}
        <div className={styles.decorationGlow} />
        <div className={styles.decorationCircle} />
      </section>

      {/* Form Section */}
      <main className={styles.rightPanel}>
        {/* Mobile Branding (Visible only on small screens) */}
        <div className={styles.mobileBrand}>
          <div className={styles.mobileBrandMark}>
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className={styles.mobileBrandName}>AttendanceSys</h1>
            <p className={styles.mobileBrandTagline}>Smart Classrooms</p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
          className={styles.card}
        >
          <header className={styles.cardHeader}>
            <h2 className={styles.title}>Welcome back</h2>
            <p className={styles.subtitle}>Enter your credentials to access your dashboard</p>
          </header>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="email">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  className={styles.input}
                  placeholder="professor@university.edu"
                  value={loginInfo.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="password">Password</label>
                <a href="#" className={styles.forgotLink}>Forgot password?</a>
              </div>
              <div className={styles.passwordWrapper}>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>
          
          <footer className={styles.cardFooter}>
            <p>Don't have an account? <Link to="/register">Create one</Link></p>
          </footer>
        </motion.div>
      </main>
    </div>
  );
};

export default Login;
