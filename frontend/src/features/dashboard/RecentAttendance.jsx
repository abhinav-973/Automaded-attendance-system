import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance.js";
import styles from "../../styles/Dashboard.module.css";

const RecentAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await axiosInstance.get("/dashboard/recent-attendance");
        if (response.data.success) {
          setAttendance(response.data.attendance);
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (attendance.length === 0) return <p>No recent attendance found.</p>;

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Class</th>
            <th>Present</th>
            <th>Absent</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((record) => (
            <tr key={record._id}>
              <td>
                {new Date(record.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </td>
              <td>{record.classId?.name}</td>
              <td>{record.presentStudents?.length}</td>
              <td>{record.absentStudents?.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentAttendance;
