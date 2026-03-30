import styles from "../../styles/Dashboard.module.css";
import TakeAttendance from "../attendance/TakeAttendance.jsx";
import StudentIdentityModal from "../students/StudentIdentityModal.jsx";

const ClassCard = ({ id, label, totalStudents, lastAttendance }) => {
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
        <StudentIdentityModal classId={id} label={label} />
      </div>
    </div>
  );
};

export default ClassCard;
