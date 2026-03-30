import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance.js";
import { getStoredUser } from "../../utils/auth.js";
import styles from "../../styles/Dashboard.module.css";
import ClassCard from "./ClassCard.jsx";
import RecentAttendance from "./RecentAttendance";

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
    <div className={styles.container}>
      <div className={styles.welcome}>
        <h2>Welcome back, {loggedInUser?.name}</h2>
        <p>Select a class, map students to the model if needed, then upload a classroom image to run attendance.</p>
      </div>

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
                label={cls.name}
                totalStudents={cls.totalStudents}
                lastAttendance={cls.lastAttendance}
              />
            ))}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Recent Attendance</h3>
        <RecentAttendance />
      </div>
    </div>
  );
};

export default Dashboard;
