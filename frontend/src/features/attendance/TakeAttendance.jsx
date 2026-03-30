import { useEffect, useState } from "react";
import axiosInstance from "../../services/axiosInstance.js";
import { handleError, handleSuccess } from "../../utils/utils.js";
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
  const [reportUrl, setReportUrl] = useState("");
  const [reportFileName, setReportFileName] = useState("");
  const [reportImageCount, setReportImageCount] = useState(0);
  const [generatedAt, setGeneratedAt] = useState("");

  useEffect(() => {
    return () => {
      if (reportUrl) {
        window.URL.revokeObjectURL(reportUrl);
      }
    };
  }, [reportUrl]);

  const closeModal = () => {
    setShowOptions(false);
  };

  const clearGeneratedReport = () => {
    if (reportUrl) {
      window.URL.revokeObjectURL(reportUrl);
    }
    setReportUrl("");
    setReportFileName("");
    setReportImageCount(0);
    setGeneratedAt("");
  };

  const triggerDownload = (downloadUrl, fileName) => {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const result = typeof reader.result === "string" ? reader.result.split(",")[1] : "";
        resolve(result);
      };
      reader.onerror = reject;
    });

  const handleImages = async (files) => {
    const selectedFiles = Array.from(files || []).filter(Boolean);
    if (selectedFiles.length === 0) {
      return;
    }

    setLoading(true);
    setReportImageCount(selectedFiles.length);

    try {
      clearGeneratedReport();
      setReportImageCount(selectedFiles.length);

      const base64Images = await Promise.all(
        selectedFiles.map((file) => fileToBase64(file))
      );

      const response = await axiosInstance.post(
        "/attendance/take",
        { classId, images: base64Images },
        { responseType: "blob" }
      );

      const generatedFileName = `attendance_${label}.csv`;
      const generatedReportUrl = window.URL.createObjectURL(new Blob([response.data]));

      setReportUrl(generatedReportUrl);
      setReportFileName(generatedFileName);
      setReportImageCount(selectedFiles.length);
      setGeneratedAt(new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }));
      handleSuccess("Attendance report generated successfully");
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
    }
  };

  const openGallery = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (event) => handleImages(event.target.files);
    input.click();
  };

  const openCamera = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (event) => handleImages(event.target.files);
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
            {loading ? (
              <>
                <h3 className={styles.modalTitle}>Generating Attendance Report</h3>
                <p className={styles.modalText}>
                  Processing classroom image{reportImageCount === 1 ? "" : "s"} for {label}.
                  Repeated students across multiple images will be counted only once.
                </p>
                <div className={styles.modalStatusCard}>
                  <p className={styles.modalStatusTitle}>Please wait</p>
                  <p className={styles.modalStatusText}>
                    We are merging attendance from all selected images and preparing the CSV report.
                  </p>
                </div>
              </>
            ) : reportUrl ? (
              <>
                <h3 className={styles.modalTitle}>Attendance Report Ready</h3>
                <p className={styles.modalText}>
                  Attendance report generated from {reportImageCount} image
                  {reportImageCount === 1 ? "" : "s"} for {label}.
                </p>
                <div className={styles.modalStatusCard}>
                  <p className={styles.modalStatusTitle}>Report generated</p>
                  <p className={styles.modalStatusText}>
                    The CSV report was generated
                    {generatedAt ? ` at ${generatedAt}` : ""}. Use the button below to download it.
                  </p>
                </div>
                <div className={styles.modalButtons}>
                  <button
                    type="button"
                    className={styles.confirmBtn}
                    onClick={() => triggerDownload(reportUrl, reportFileName)}
                  >
                    Download Report
                  </button>
                  <button
                    className={styles.confirmBtn}
                    onClick={clearGeneratedReport}
                  >
                    Generate Again
                  </button>
                </div>
                <button className={styles.cancelBtn} onClick={closeModal}>
                  Close
                </button>
              </>
            ) : (
              <>
                <h3 className={styles.modalTitle}>Take Attendance</h3>
                <p className={styles.modalText}>
                  Choose image source. Gallery supports multiple classroom images
                  for the same class.
                </p>
                <div className={styles.modalStatusCard}>
                  <p className={styles.modalStatusTitle}>How it works</p>
                  <p className={styles.modalStatusText}>
                    You can upload multiple photos of the same class. If the same student appears in more than one image, they will still be marked present only once.
                  </p>
                </div>
                <div className={styles.modalButtons}>
                  <button className={styles.confirmBtn} onClick={openCamera}>
                    Camera
                  </button>
                  <button className={styles.confirmBtn} onClick={openGallery}>
                    Gallery
                  </button>
                </div>
                <button className={styles.cancelBtn} onClick={closeModal}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default TakeAttendance;
