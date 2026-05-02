import { useEffect, useRef, useState } from "react";
import axiosInstance from "../../services/axiosInstance.js";
import { handleError, handleSuccess } from "../../utils/utils.js";
import styles from "../../styles/Dashboard.module.css";

const attendanceRequestTimeoutMs = Number.parseInt(
  import.meta.env.VITE_ATTENDANCE_TIMEOUT_MS || "180000",
  10
);

const initialProgressState = {
  percent: 0,
  title: "",
  detail: "",
};

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
  const [progress, setProgress] = useState(initialProgressState);
  const progressIntervalRef = useRef(null);
  const progressTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (reportUrl) {
        window.URL.revokeObjectURL(reportUrl);
      }
    };
  }, [reportUrl]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }

      if (progressTimeoutRef.current) {
        window.clearTimeout(progressTimeoutRef.current);
      }
    };
  }, []);

  const clearProgressTimers = () => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (progressTimeoutRef.current) {
      window.clearTimeout(progressTimeoutRef.current);
      progressTimeoutRef.current = null;
    }
  };

  const resetProgress = () => {
    clearProgressTimers();
    setProgress(initialProgressState);
  };

  const setProgressState = ({ percent, title, detail }) => {
    setProgress((current) => ({
      percent: Math.max(current.percent, Math.min(100, Math.round(percent))),
      title: title || current.title,
      detail: detail || current.detail,
    }));
  };

  const startProcessingProgress = (imageCount) => {
    clearProgressTimers();

    setProgressState({
      percent: 58,
      title: "Recognizing faces",
      detail: `The model is matching faces across ${imageCount} classroom image${
        imageCount === 1 ? "" : "s"
      }.`,
    });

    progressIntervalRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current.percent >= 88) {
          return current;
        }

        const remaining = 88 - current.percent;
        return {
          ...current,
          percent: Math.min(
            88,
            current.percent + Math.max(1, Math.round(remaining * 0.2))
          ),
        };
      });
    }, 450);

    progressTimeoutRef.current = window.setTimeout(() => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      setProgress((current) => ({
        ...current,
        percent: Math.max(current.percent, 90),
        title: "Generating report",
        detail:
          "Attendance is being merged, absences are being marked, and the CSV report is being prepared.",
      }));

      progressIntervalRef.current = window.setInterval(() => {
        setProgress((current) => {
          if (current.percent >= 97) {
            return current;
          }

          const remaining = 97 - current.percent;
          return {
            ...current,
            percent: Math.min(
              97,
              current.percent + Math.max(1, Math.round(remaining * 0.25))
            ),
          };
        });
      }, 500);
    }, 2400);
  };

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
    resetProgress();
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

    clearGeneratedReport();
    setLoading(true);
    setReportImageCount(selectedFiles.length);
    setProgress({
      percent: 8,
      title: "Preparing images",
      detail: "Getting your classroom images ready before upload starts.",
    });

    try {
      setReportImageCount(selectedFiles.length);

      const base64Images = await Promise.all(
        selectedFiles.map((file) => fileToBase64(file))
      );

      setProgressState({
        percent: 16,
        title: "Uploading images",
        detail: `Uploading ${selectedFiles.length} classroom image${
          selectedFiles.length === 1 ? "" : "s"
        } to the attendance service.`,
      });

      let processingStarted = false;

      const response = await axiosInstance.post(
        "/attendance/take",
        { classId, images: base64Images },
        {
          responseType: "blob",
          timeout: Number.isFinite(attendanceRequestTimeoutMs)
            ? attendanceRequestTimeoutMs
            : 180000,
          onUploadProgress: (event) => {
            if (!event.total) {
              return;
            }

            const uploadRatio = event.total > 0 ? event.loaded / event.total : 0;

            setProgressState({
              percent: 16 + uploadRatio * 40,
              title: "Uploading images",
              detail: `Uploading ${selectedFiles.length} classroom image${
                selectedFiles.length === 1 ? "" : "s"
              } to the attendance service.`,
            });

            if (uploadRatio >= 1 && !processingStarted) {
              processingStarted = true;
              startProcessingProgress(selectedFiles.length);
            }
          },
        }
      );

      if (!processingStarted) {
        startProcessingProgress(selectedFiles.length);
      }

      clearProgressTimers();
      setProgress({
        percent: 100,
        title: "Report ready",
        detail: "Attendance has been processed and the CSV report is ready to download.",
      });

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
      clearProgressTimers();
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
        {loading ? progress.title || "Processing..." : "Take Attendance"}
      </button>

      {showOptions && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            {loading ? (
              <>
                <h3 className={styles.modalTitle}>Generating Attendance Report</h3>
                <p className={styles.modalText}>
                  Working on {reportImageCount} classroom image
                  {reportImageCount === 1 ? "" : "s"} for {label}. Repeated students
                  across multiple images will still be counted only once.
                </p>
                <div className={styles.modalStatusCard}>
                  <div className={styles.progressHeader}>
                    <p className={styles.modalStatusTitle}>{progress.title || "Processing"}</p>
                    <span className={styles.progressValue}>{progress.percent}%</span>
                  </div>
                  <div
                    className={styles.progressTrack}
                    role="progressbar"
                    aria-valuenow={progress.percent}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label="Attendance generation progress"
                  >
                    <div
                      className={styles.progressFill}
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <p className={styles.modalStatusText}>
                    {progress.detail ||
                      "Uploading images, recognizing faces, and preparing the report."}
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
