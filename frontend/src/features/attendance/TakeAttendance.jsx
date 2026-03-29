import { useState } from "react";
import axios from "axios";
import { handleError } from "../../utils/utils.js";
import styles from "../../styles/Dashboard.module.css";

const TakeAttendance = ({ classId, label }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImage = async (file) => {
    setLoading(true);
    try {
      // ← wrapped in Promise so finally waits for onloadend to finish
      await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onloadend = async () => {
          try {
            const base64Image = reader.result.split(",")[1];

            const response = await axios.post(
              "http://localhost:3000/attendance/take",
              { classId, image: base64Image },
              {
                withCredentials: true,
                responseType: "blob",
              }
            );

            // Download CSV
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `attendance_${label}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            resolve();

          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = reject;
      });

    } catch (error) {
      console.error("Attendance error:", error);
      handleError("Failed to take attendance. Please try again."); // ← error toast added
    } finally {
      setLoading(false);       // ← now runs AFTER onloadend finishes
      setShowOptions(false);
    }
  };

  const openGallery = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => handleImage(e.target.files[0]);
    input.click();
  };

  const openCamera = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (e) => handleImage(e.target.files[0]);
    input.click();
  };

  return (
    <>
      <button
        className={styles.primaryButton}
        onClick={() => setShowOptions(true)}
        disabled={loading}
      >
        {loading ? "Processing..." : "Take Attendance"}
      </button>

      {showOptions && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Take Attendance</h3>
            <p className={styles.modalText}>Choose image source</p>
            <div className={styles.modalButtons}>
              <button className={styles.confirmBtn} onClick={openCamera}>
                📷 Camera
              </button>
              <button className={styles.confirmBtn} onClick={openGallery}>
                🖼️ Gallery
              </button>
            </div>
            <button
              className={styles.cancelBtn}
              onClick={() => setShowOptions(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TakeAttendance;