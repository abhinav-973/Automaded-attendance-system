import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance.js";
import styles from "../../styles/Dashboard.module.css";
import { motion } from "framer-motion";
import { CalendarDays, Users, CheckCircle2, XCircle } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.historySkeleton} />
        ))}
      </div>
    );
  }

  if (attendance.length === 0) {
    return (
      <div className={styles.emptyGlassState}>
        <CalendarDays size={40} className="text-slate-300 mb-3" />
        <p>No attendance history recorded yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.historyList}>
      {attendance.map((record, index) => {
        const present = record.presentStudents?.length || 0;
        const absent = record.absentStudents?.length || 0;
        const total = present + absent;
        const ratio = total > 0 ? Math.round((present / total) * 100) : 0;
        
        // Mini gauge calculations
        const strokeDasharray = 2 * Math.PI * 18; // r=18
        const offset = strokeDasharray - (ratio / 100) * strokeDasharray;

        return (
          <motion.div
            key={record._id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
            className={styles.historyCard}
          >
            {/* Date Block */}
            <div className={styles.historyDate}>
              <div className={styles.dateIconWrapper}>
                <CalendarDays size={18} className="text-blue-500" />
              </div>
              <div className={styles.dateText}>
                <span className={styles.day}>{new Date(record.date).getDate()}</span>
                <span className={styles.month}>
                  {new Date(record.date).toLocaleDateString("en-IN", { month: "short" })}
                </span>
              </div>
            </div>

            {/* Class Info */}
            <div className={styles.historyClass}>
              <h5 className={styles.historyClassName}>{record.classId?.name}</h5>
              <span className={styles.historyTotal}>
                <Users size={12} /> {total} Students
              </span>
            </div>

            {/* Stats Pills */}
            <div className={styles.historyStats}>
              <div className={styles.statPillPresent}>
                <CheckCircle2 size={14} />
                <span>{present} Present</span>
              </div>
              <div className={styles.statPillAbsent}>
                <XCircle size={14} />
                <span>{absent} Absent</span>
              </div>
            </div>

            {/* Mini Radial Gauge (Desktop & Tablet) */}
            <div className={styles.historyRatio}>
              <div className={styles.miniGaugeWrapper}>
                <svg className={styles.miniGaugeSvg} viewBox="0 0 44 44">
                  <circle className={styles.miniGaugeBg} cx="22" cy="22" r="18" />
                  <motion.circle
                    className={styles.miniGaugeFill}
                    cx="22" cy="22" r="18"
                    strokeDasharray={strokeDasharray}
                    initial={{ strokeDashoffset: strokeDasharray }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: index * 0.1 + 0.2 }}
                  />
                </svg>
                <span className={styles.miniGaugeText}>{ratio}%</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default RecentAttendance;