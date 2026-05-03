import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/Login.module.css";
import axiosInstance from "../../services/axiosInstance.js";
import { handleSuccess, handleError } from "../../utils/utils.js";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [registerInfo, setRegisterInfo] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setRegisterInfo({ ...registerInfo, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { name, email, password } = registerInfo;
    if (!name || !email || !password) {
      return handleError("Please fill all fields");
    }

    setIsLoading(true);

    try {
      const response = await axiosInstance.post("/auth/register", registerInfo);
      const { success, message } = response.data;

      if (success) {
        handleSuccess(message);
        setTimeout(() => navigate("/login", { replace: true }), 800);
      }
    } catch (error) {
      handleError(
        error.response?.data?.message || "Registration failed. Please try again."
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
              <span className="text-sm font-bold text-slate-300 tracking-wider uppercase">Join the Future</span>
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
            <h2 className={styles.title}>Create an account</h2>
            <p className={styles.subtitle}>Register to get started with your dashboard</p>
          </header>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Name Field */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="name">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  id="name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  className={styles.input}
                  placeholder="Prof. John Doe"
                  value={registerInfo.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
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
                  value={registerInfo.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="password">Password</label>
              </div>
              <div className={styles.passwordWrapper}>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  className={styles.input}
                  placeholder="Create a strong password"
                  value={registerInfo.password}
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
              {isLoading ? "Registering..." : "Register"}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>
          
          <footer className={styles.cardFooter}>
            <p>Already have an account? <a href="/login">Sign in</a></p>
          </footer>
        </motion.div>
      </main>
    </div>
  );
};

export default Register;