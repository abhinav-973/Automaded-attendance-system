import styles from "../../styles/Dashboard.module.css";
import TakeAttendance from "../attendance/TakeAttendance.jsx";

const ClassCard = ({ id, label, totalStudents, lastAttendance }) => {
  // ← renamed className → label (className is reserved in React)
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
      <TakeAttendance classId={id} label={label} />
    </div>
  );
};

export default ClassCard;