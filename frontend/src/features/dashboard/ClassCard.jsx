import styles from "../../styles/Dashboard.module.css";
import TakeAttendance from "../attendance/TakeAttendance.jsx";
import StudentIdentityModal from "../students/StudentIdentityModal.jsx";

const ClassCard = ({
  id,
  label,
  totalStudents,
  lastAttendance,
  mappedStudents = 0,
  unmappedStudents = 0,
  needsModelMapping = false,
}) => {
  return (
    <div className={styles.classCard}>
      <h4>{label}</h4>
      <p>Students: {totalStudents}</p>
      <p>
        Last Attendance:{" "}
        {lastAttendance
          ? new Date(lastAttendance).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })
          : "No attendance yet"}
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <TakeAttendance classId={id} label={label} />
        <div className={styles.setupRow}>
          {totalStudents === 0 ? (
            <span className={`${styles.setupBadge} ${styles.setupBadgeMuted}`}>
              No students added yet
            </span>
          ) : needsModelMapping ? (
            <span className={`${styles.setupBadge} ${styles.setupBadgeWarning}`}>
              {unmappedStudents} student{unmappedStudents === 1 ? "" : "s"} need model mapping
            </span>
          ) : (
            <span className={`${styles.setupBadge} ${styles.setupBadgeReady}`}>
              {mappedStudents} mapped and ready
            </span>
          )}

          {totalStudents > 0 && (
            <StudentIdentityModal
              classId={id}
              label={label}
              triggerLabel={needsModelMapping ? "Complete setup" : "Review mappings"}
              triggerClassName={styles.secondaryAction}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
