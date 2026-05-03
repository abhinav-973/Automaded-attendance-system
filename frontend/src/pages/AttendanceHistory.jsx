import { useState, useEffect } from "react";
import axiosInstance from "../services/axiosInstance.js";
import styles from "../styles/AttendanceHistory.module.css";
import { motion } from "framer-motion";
import { Search, CalendarDays, Filter, Users, CheckCircle2, XCircle } from "lucide-react";

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
    const matchClass = selectedClass === "All" || row.classId?.name === selectedClass;
    const dateString = new Date(row.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const matchDate = dateString.toLowerCase().includes(searchDate.toLowerCase());
    return matchClass && matchDate;
  });

  return (
    <div className={styles.pageShell}>
      {/* Background Ambient Mesh */}
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>

      <div className={styles.container}>
        {/* Dark Glass Header */}
        <header className={styles.glassHeader}>
          <div className={styles.headerContent}>
            <div className={styles.iconBox}>
              <CalendarDays size={28} className="text-blue-400" />
            </div>
            <div>
              <h1 className={styles.title}>Attendance History</h1>
              <p className={styles.subtitle}>Review and filter past classroom records</p>
            </div>
          </div>
        </header>

        {/* Glass Filter Bar */}
        <div className={styles.filterSection}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by date (e.g. 12 May)..."
              value={searchDate}
              onChange={(event) => setSearchDate(event.target.value)}
            />
          </div>

          <div className={styles.classFiltersWrapper}>
            <div className={styles.filterLabel}>
              <Filter size={14} /> Classes:
            </div>
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
        </div>

        {/* Main Data View */}
        <div className={styles.dataWrapper}>
          {loading ? (
            <div className={styles.loaderGrid}>
              {[1, 2, 3, 4].map(i => <div key={i} className={styles.skeletonRow} />)}
            </div>
          ) : (
            <table className={styles.table}>
              <thead className={styles.desktopOnly}>
                <tr className={styles.tableHead}>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>Classroom</th>
                  <th className={styles.th}>Present</th>
                  <th className={styles.th}>Absent</th>
                  <th className={styles.th}>Total</th>
                  <th className={styles.th}>Ratio</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((row, index) => {
                    const present = row.presentStudents?.length || 0;
                    const absent = row.absentStudents?.length || 0;
                    const total = present + absent;
                    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
                    
                    // Radial Gauge Math
                    const strokeDasharray = 2 * Math.PI * 16; 
                    const offset = strokeDasharray - (percentage / 100) * strokeDasharray;

                    return (
                      <motion.tr 
                        key={row._id} 
                        className={`${styles.tableRow} group`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <td className={styles.td}>
                          <div className={styles.dateCell}>
                            <span className={styles.dateDay}>{new Date(row.date).getDate()}</span>
                            <span className={styles.dateMonth}>
                              {new Date(row.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                            </span>
                          </div>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.classBadge}>{row.classId?.name}</span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.statPillPresent}>
                            <CheckCircle2 size={14} /> {present}
                          </div>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.statPillAbsent}>
                            <XCircle size={14} /> {absent}
                          </div>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.totalCell}>
                            <Users size={14} className="text-slate-400" /> {total}
                          </div>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.ratioWrapper}>
                            <div className={styles.miniGauge}>
                              <svg className={styles.gaugeSvg} viewBox="0 0 40 40">
                                <circle className={styles.gaugeBg} cx="20" cy="20" r="16" />
                                <motion.circle
                                  className={styles.gaugeFill}
                                  cx="20" cy="20" r="16"
                                  strokeDasharray={strokeDasharray}
                                  initial={{ strokeDashoffset: strokeDasharray }}
                                  animate={{ strokeDashoffset: offset }}
                                  transition={{ duration: 1.5, delay: index * 0.05 + 0.2 }}
                                />
                              </svg>
                              <span className={styles.gaugeText}>{percentage}%</span>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className={styles.emptyState}>
                        <Search size={40} className="text-slate-300 mb-4" />
                        <p>No records found for this filter.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;