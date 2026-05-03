import { useState, useRef } from "react";
import axiosInstance from "../services/axiosInstance.js";
import { handleSuccess, handleError } from "../utils/utils.js";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, 
  UploadCloud, 
  Users, 
  GraduationCap, 
  FileSpreadsheet, 
  CheckCircle2, 
  Loader2, 
  Info 
} from "lucide-react";

const AdminUpload = () => {
  const [teacherFile, setTeacherFile] = useState(null);
  const [studentFile, setStudentFile] = useState(null);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);

  const teacherInputRef = useRef(null);
  const studentInputRef = useRef(null);

  const uploadTeachers = async () => {
    if (!teacherFile) {
      return handleError("Please select a file");
    }

    setTeacherLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", teacherFile);
      const response = await axiosInstance.post("/csv/upload-teachers", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        handleSuccess(response.data.message);
        setTeacherFile(null); // Clear after success
      }
    } catch (error) {
      handleError(error.response?.data?.message || "Upload failed");
    } finally {
      setTeacherLoading(false);
    }
  };

  const uploadStudents = async () => {
    if (!studentFile) {
      return handleError("Please select a file");
    }

    setStudentLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", studentFile);
      const response = await axiosInstance.post("/csv/upload-students", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        handleSuccess(response.data.message);
        setStudentFile(null); // Clear after success
      }
    } catch (error) {
      handleError(error.response?.data?.message || "Upload failed");
    } finally {
      setStudentLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50 px-4 py-8 sm:p-8 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.6, bounce: 0 }}
        className="w-full max-w-2xl rounded-[2rem] border border-slate-200/60 bg-white p-6 sm:p-10 shadow-xl shadow-slate-200/50"
      >
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 mb-4">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mb-2">
            System Administration
          </h1>
          <p className="text-sm font-medium text-slate-500 max-w-md">
            Upload CSV files to securely populate the application database. Always upload teacher records before student records.
          </p>
        </div>

        <div className="space-y-6">
          {/* Teachers Upload Section */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/50 p-5 sm:p-6 transition-all hover:border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">1. Teachers Database</h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Format: <code className="bg-slate-200/70 px-1 py-0.5 rounded text-slate-700">name, email, password, classes (sep. by |), [role]</code>
                </p>
              </div>
            </div>

            {/* Custom File Dropzone */}
            <div 
              onClick={() => teacherInputRef.current?.click()}
              className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all ${
                teacherFile 
                  ? 'border-blue-400 bg-blue-50/50' 
                  : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
              }`}
            >
              <input
                ref={teacherInputRef}
                type="file"
                accept=".csv"
                onChange={(event) => setTeacherFile(event.target.files?.[0] || null)}
                className="hidden"
              />
              
              <AnimatePresence mode="wait">
                {teacherFile ? (
                  <motion.div 
                    key="selected"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-center gap-2"
                  >
                    <FileSpreadsheet size={32} className="text-blue-500" />
                    <p className="text-sm font-bold text-slate-700">{teacherFile.name}</p>
                    <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Ready to upload
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-center gap-2 text-slate-500 group-hover:text-blue-600 transition-colors"
                  >
                    <UploadCloud size={32} />
                    <p className="text-sm font-semibold">Click to select Teachers CSV</p>
                    <p className="text-xs font-medium opacity-70">CSV files only up to 5MB</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={uploadTeachers}
              disabled={teacherLoading || !teacherFile}
              className="mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {teacherLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Uploading...</>
              ) : (
                "Upload Teachers Data"
              )}
            </button>
          </section>

          {/* Students Upload Section */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/50 p-5 sm:p-6 transition-all hover:border-emerald-200">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">2. Students Database</h2>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    Format: <code className="bg-slate-200/70 px-1 py-0.5 rounded text-slate-700">name, roll, email, class, [teacherEmail], [modelIdentity]</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Custom File Dropzone */}
            <div 
              onClick={() => studentInputRef.current?.click()}
              className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all ${
                studentFile 
                  ? 'border-emerald-400 bg-emerald-50/50' 
                  : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/50'
              }`}
            >
              <input
                ref={studentInputRef}
                type="file"
                accept=".csv"
                onChange={(event) => setStudentFile(event.target.files?.[0] || null)}
                className="hidden"
              />
              
              <AnimatePresence mode="wait">
                {studentFile ? (
                  <motion.div 
                    key="selected-student"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-center gap-2"
                  >
                    <FileCsv size={32} className="text-emerald-500" />
                    <p className="text-sm font-bold text-slate-700">{studentFile.name}</p>
                    <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Ready to upload
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty-student"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-center gap-2 text-slate-500 group-hover:text-emerald-600 transition-colors"
                  >
                    <UploadCloud size={32} />
                    <p className="text-sm font-semibold">Click to select Students CSV</p>
                    <p className="text-xs font-medium opacity-70">CSV files only up to 5MB</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Optional Fields Hint */}
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-200/50 p-3 text-slate-600">
              <Info size={16} className="shrink-0 mt-0.5 text-slate-500" />
              <p className="text-[11px] font-medium leading-relaxed">
                <span className="font-bold text-slate-700">Note:</span> Columns wrapped in brackets <code>[ ]</code> are optional. If <code>modelIdentity</code> is omitted, students must upload identity photos manually upon first login.
              </p>
            </div>

            <button
              onClick={uploadStudents}
              disabled={studentLoading || !studentFile}
              className="mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {studentLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Uploading...</>
              ) : (
                "Upload Students Data"
              )}
            </button>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminUpload;