import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance.js";
import { getStoredUser } from "../../utils/auth.js";
import styles from "../../styles/Dashboard.module.css";
import ClassCard from "./ClassCard.jsx";
import RecentAttendance from "./RecentAttendance";
import { LayoutDashboard, LogOut, UserCircle, Bell } from "lucide-react";

const Dashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const loggedInUser = getStoredUser();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axiosInstance.get("/dashboard/classes");
        if (response.data.success) {
          setClasses(response.data.classes);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  return (
    <div className={styles.dashboardShell}>
      {/* Background Bokeh Elements */}
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>

      <div className={styles.container}>
        <header className={styles.glassHeader}>
          <div className={styles.heroBrand}>
            <div className={styles.badge}>Teacher Dashboard</div>
            <h2 className={styles.greeting}>
              Hello, <span className={styles.userName}>{loggedInUser?.name || 'Professor'}</span>
            </h2>
            <p className={styles.heroSubtext}>
              You have {classes.length} active classes. Manage your classroom identity mapping below.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconBtn}><Bell size={20} /></button>
            <div className={styles.userProfile}>
              <div className={styles.avatar}>{(loggedInUser?.name || 'P').charAt(0)}</div>
              <span className={styles.profileName}>{loggedInUser?.name}</span>
            </div>
          </div>
        </header>

        <main className={styles.mainContent}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Your Classrooms</h3>
              <div className={styles.countChip}>{classes.length} Total</div>
            </div>

            {loading ? (
              <div className={styles.loaderGrid}>
                {[1, 2].map(i => <div key={i} className={styles.skeletonCard} />)}
              </div>
            ) : (
              <div className={styles.classGrid}>
                {classes.map((cls) => (
                  <ClassCard
                    key={cls._id}
                    id={cls._id}
                    label={cls.name}
                    totalStudents={cls.totalStudents}
                    lastAttendance={cls.lastAttendance}
                    mappedStudents={cls.mappedStudents}
                    unmappedStudents={cls.unmappedStudents}
                    needsModelMapping={cls.needsModelMapping}
                  />
                ))}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Recent Activity</h3>
            </div>
            <RecentAttendance />
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;