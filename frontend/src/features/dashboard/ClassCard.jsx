import styles from "../../styles/Dashboard.module.css";
import TakeAttendance from "../attendance/TakeAttendance.jsx";
import StudentIdentityModal from "../students/StudentIdentityModal.jsx";
import { motion } from "framer-motion";
import { Users, Calendar, ArrowRight } from "lucide-react";

const ClassCard = ({ id, label, totalStudents, lastAttendance, mappedStudents = 0, needsModelMapping = false }) => {
  const progress = totalStudents > 0 ? Math.round((mappedStudents / totalStudents) * 100) : 0;
  const strokeDasharray = 2 * Math.PI * 34; // Circumference for r=34
  const offset = strokeDasharray - (progress / 100) * strokeDasharray;

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
          {lastAttendance ? 'Last: ' + new Date(lastAttendance).toLocaleDateString('en-IN', {day:'2-digit', month:'short'}) : 'New Class'}
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.gaugeWrapper}>
          <svg className={styles.gaugeSvg} viewBox="0 0 80 80">
            <circle className={styles.gaugeBg} cx="40" cy="40" r="34" />
            <motion.circle 
              className={styles.gaugeFill} 
              cx="40" cy="40" r="34"
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
        <StudentIdentityModal
          classId={id}
          label={label}
          triggerLabel="Review Models"
          triggerClassName={styles.ghostBtn}
        />
      </div>
    </motion.div>
  );
};

export default ClassCard;