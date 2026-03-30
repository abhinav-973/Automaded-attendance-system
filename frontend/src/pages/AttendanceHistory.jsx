import { useState, useEffect } from "react";
import axiosInstance from "../services/axiosInstance.js";
import styles from "../styles/AttendanceHistory.module.css";

const AttendanceHistory = () => {
  const [attendance, setAttendance] = useState([]);
  const [classes, setClasses] = useState(["All"]);
  const [selectedClass, setSelectedClass] = useState("All");
  const [searchDate, setSearchDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await axiosInstance.get("/dashboard/recent-attendance");
        if (response.data.success) {
          const data = response.data.attendance;
          setAttendance(data);

          const uniqueClasses = [
            "All",
            ...new Set(data.map((record) => record.classId?.name).filter(Boolean)),
          ];
          setClasses(uniqueClasses);
        }
      } catch (error) {
        console.error("Error fetching attendance history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const filtered = attendance.filter((row) => {
    const matchClass =
      selectedClass === "All" || row.classId?.name === selectedClass;
    const dateString = new Date(row.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const matchDate = dateString.toLowerCase().includes(searchDate.toLowerCase());
    return matchClass && matchDate;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Attendance History</h1>
          <p className={styles.subtitle}>View and filter past attendance records</p>
        </div>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by date..."
          value={searchDate}
          onChange={(event) => setSearchDate(event.target.value)}
        />
        <div className={styles.classFilters}>
          {classes.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`${styles.filterBtn} ${selectedClass === cls ? styles.filterBtnActive : ""}`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHead}>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Class</th>
                <th className={styles.th}>Present</th>
                <th className={styles.th}>Absent</th>
                <th className={styles.th}>Total</th>
                <th className={styles.th}>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((row) => {
                  const present = row.presentStudents?.length || 0;
                  const absent = row.absentStudents?.length || 0;
                  const total = present + absent;
                  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

                  return (
                    <tr key={row._id} className={styles.tableRow}>
                      <td className={styles.td}>
                        {new Date(row.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className={styles.td}>
                        <span className={styles.classBadge}>{row.classId?.name}</span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.presentText}>{present}</span>
                      </td>
                      <td className={styles.td}>
                        <span className={absent > 0 ? styles.absentText : styles.zeroText}>
                          {absent}
                        </span>
                      </td>
                      <td className={styles.td}>{total}</td>
                      <td className={styles.td}>
                        <div className={styles.progressWrapper}>
                          <div className={styles.progressBar}>
                            <div
                              className={`${styles.progressFill} ${
                                percentage >= 90 ? styles.progressGreen :
                                percentage >= 75 ? styles.progressYellow :
                                styles.progressRed
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className={styles.percentageText}>{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;
