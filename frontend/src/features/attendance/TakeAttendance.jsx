import { useState } from "react";
import axiosInstance from "../../services/axiosInstance.js";
import { handleError } from "../../utils/utils.js";
import styles from "../../styles/Dashboard.module.css";

const extractBlobMessage = async (blob) => {
  if (!(blob instanceof Blob)) {
    return null;
  }

  try {
    const text = await blob.text();
    const parsed = JSON.parse(text);
    return parsed.message || null;
  } catch {
    return null;
  }
};

const TakeAttendance = ({ classId, label }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImage = async (file) => {
    if (!file) {
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onloadend = async () => {
          try {
            const base64Image = reader.result.split(",")[1];

            const response = await axiosInstance.post(
              "/attendance/take",
              { classId, image: base64Image },
              { responseType: "blob" }
            );

            const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = downloadUrl;
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
      const blobMessage = await extractBlobMessage(error.response?.data);
      handleError(
        blobMessage ||
        error.response?.data?.message ||
        "Failed to take attendance. Please try again."
      );
    } finally {
      setLoading(false);
      setShowOptions(false);
    }
  };

  const openGallery = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (event) => handleImage(event.target.files?.[0]);
    input.click();
  };

  const openCamera = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (event) => handleImage(event.target.files?.[0]);
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
                Camera
              </button>
              <button className={styles.confirmBtn} onClick={openGallery}>
                Gallery
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
