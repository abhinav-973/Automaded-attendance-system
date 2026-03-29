import { useState, useEffect } from "react";
import axios from "axios";
import styles from "../../styles/Dashboard.module.css";
import ClassCard from "./Classcard";
import RecentAttendance from "./RecentAttendance";

const Dashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get("http://localhost:3000/dashboard/classes", {
          withCredentials: true,
        });
        if (res.data.success) {
          setClasses(res.data.classes);
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
    <div className={styles.container}>

      {/* Welcome */}
      <div className={styles.welcome}>
        <h2>Welcome back, {loggedInUser?.name} 👋</h2>
        <p>Select a class to take attendance.</p>
      </div>

      {/* Classes */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Your Classes</h3>
        {loading ? (
          <p>Loading...</p>
        ) : classes.length === 0 ? (
          <p>No classes found.</p>
        ) : (
          <div className={styles.classGrid}>
            {classes.map((cls) => (
              <ClassCard
                key={cls._id}
                id={cls._id}
                label={cls.name}              // ← renamed from className
                totalStudents={cls.totalStudents}
                lastAttendance={cls.lastAttendance}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Attendance */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Recent Attendance</h3>
        <RecentAttendance />
      </div>

    </div>
  );
};

export default Dashboard;