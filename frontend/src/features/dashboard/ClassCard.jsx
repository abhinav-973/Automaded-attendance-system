import styles from "../../styles/Dashboard.module.css";
import TakeAttendance from "../attendance/TakeAttendance.jsx";
import axiosInstance from "../../services/axiosInstance.js";
import { Download } from "lucide-react";
import { motion } from "framer-motion";
import { Users, Calendar, ArrowRight } from "lucide-react";

const ClassCard = ({
  id,
  label,
  totalStudents,
  lastAttendance,
  lastAttendanceId,
  mappedStudents = 0,
  needsModelMapping = false,
}) => {
  const progress =
    totalStudents > 0 ? Math.round((mappedStudents / totalStudents) * 100) : 0;
  const strokeDasharray = 2 * Math.PI * 34; // Circumference for r=34
  const offset = strokeDasharray - (progress / 100) * strokeDasharray;
  const downloadLastReport = async () => {
    if (!lastAttendanceId) {
      return;
    }

    try {
      const response = await axiosInstance.get(
        `/attendance/report/${lastAttendanceId}`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: "text/csv",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance_${label.replace(/\s+/g, "_")}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download attendance report:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.glassCard}
    >
      <div className={styles.cardHeader}>
        <div>
          <h4 className={styles.cardTitle}>{label}</h4>
          <p className={styles.cardSubtitle}>{totalStudents} Students</p>
        </div>
        <div className={styles.statusBadge}>
          <span className={styles.pulseDot} />
          {lastAttendance
            ? "Last: " +
              new Date(lastAttendance).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
              })
            : "New Class"}
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.gaugeWrapper}>
          <svg className={styles.gaugeSvg} viewBox="0 0 80 80">
            <circle className={styles.gaugeBg} cx="40" cy="40" r="34" />
            <motion.circle
              className={styles.gaugeFill}
              cx="40"
              cy="40"
              r="34"
              strokeDasharray={strokeDasharray}
              initial={{ strokeDashoffset: strokeDasharray }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className={styles.gaugeText}>
            <span className={styles.gaugePercent}>{progress}%</span>
            <span className={styles.gaugeLabel}>Mapped</span>
          </div>
        </div>

        <div className={styles.cardInfo}>
          <div className={styles.infoItem}>
            <strong>Total students</strong>
            <p>Know start mapping or finish radial mapping below.</p>
          </div>
          {needsModelMapping && (
            <div className={styles.alertBox}>Setup Required</div>
          )}
        </div>
      </div>

      <div className={styles.cardFooter}>
        <TakeAttendance classId={id} label={label} />
        {/* <StudentIdentityModal
          classId={id}
          label={label}
          triggerLabel="Review Models"
          triggerClassName={styles.ghostBtn}
        /> */}
        {lastAttendanceId && (
          <button
            type="button"
            onClick={downloadLastReport}
            className={styles.ghostBtn}
          >
            <Download size={16} />
            Download Last Report
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ClassCard;
