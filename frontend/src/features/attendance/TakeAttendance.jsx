import { useEffect, useRef, useState } from "react";
import axiosInstance from "../../services/axiosInstance.js";
import { handleError, handleSuccess } from "../../utils/utils.js";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  Image as ImageIcon, 
  X, 
  Download, 
  RefreshCw, 
  ScanFace, 
  CheckCircle2, 
  Loader2, 
  FileSpreadsheet,
  Info
} from "lucide-react";

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

      const generatedFileName = `attendance_${label.replace(/\s+/g, "_")}_${new Date().getTime()}.csv`;
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
        type="button"
        onClick={() => setShowOptions(true)}
        disabled={loading}
        className="group flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin text-blue-400" />
        ) : (
          <ScanFace size={18} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
        )}
        {loading ? progress.title || "Processing..." : "Take Attendance"}
      </button>

      <AnimatePresence>
        {showOptions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={!loading ? closeModal : undefined}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0 }}
              className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-[1.5rem] bg-[#f8fafc] shadow-2xl"
            >
              {/* Premium Header */}
              <div className="flex-shrink-0 bg-slate-900 p-5" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/10 shadow-inner backdrop-blur-md">
                      {reportUrl ? <FileSpreadsheet size={24} className="text-emerald-400" /> : <ScanFace size={24} className="text-blue-400" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-white leading-tight">
                        {reportUrl ? "Report Ready" : "Attendance"}
                      </h3>
                      <p className="text-xs font-medium text-slate-400 line-clamp-1 mt-0.5">
                        {label}
                      </p>
                    </div>
                  </div>
                  {!loading && (
                    <button
                      onClick={closeModal}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-white/20 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Body Area */}
              <div className="p-5">
                {loading ? (
                  /* LOADING STATE */
                  <div className="flex flex-col gap-4">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          {progress.title || "Processing"}
                        </p>
                        <span className="text-xs font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                          {progress.percent}%
                        </span>
                      </div>
                      
                      {/* Animated Progress Bar */}
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-blue-100/50 mb-3">
                        <motion.div
                          className="h-full bg-blue-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.percent}%` }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                      </div>
                      
                      <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
                        {progress.detail || "Uploading images and preparing the report."}
                      </p>
                    </div>
                  </div>
                ) : reportUrl ? (
                  /* SUCCESS STATE */
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <CheckCircle2 size={32} />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mb-1">Success!</h4>
                      <p className="text-sm font-medium text-slate-500 max-w-[250px]">
                        Report generated from {reportImageCount} image{reportImageCount === 1 ? "" : "s"}.
                        {generatedAt && <span className="block mt-1 text-xs">Generated at: {generatedAt}</span>}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => triggerDownload(reportUrl, reportFileName)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.98]"
                      >
                        <Download size={18} />
                        Download CSV Report
                      </button>
                      <button
                        onClick={clearGeneratedReport}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]"
                      >
                        <RefreshCw size={16} className="text-slate-400" />
                        Take Another
                      </button>
                    </div>
                  </div>
                ) : (
                  /* INITIAL SELECTION STATE */
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-3 text-blue-800">
                      <Info size={18} className="shrink-0 mt-0.5 text-blue-500" />
                      <p className="text-[13px] font-medium leading-relaxed">
                        Upload multiple photos to capture the whole room. Students appearing in multiple images are counted once.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-1">
                      <button
                        onClick={openCamera}
                        className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md active:scale-95"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-600 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600">
                          <Camera size={24} />
                        </div>
                        <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700">Camera</span>
                      </button>
                      
                      <button
                        onClick={openGallery}
                        className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md active:scale-95"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-600 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600">
                          <ImageIcon size={24} />
                        </div>
                        <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700">Gallery</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TakeAttendance;