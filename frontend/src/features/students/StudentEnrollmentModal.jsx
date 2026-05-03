import { useState } from "react";
import axiosInstance from "../../services/axiosInstance.js";
import { handleError, handleSuccess } from "../../utils/utils.js";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, User, CheckCircle2, AlertCircle, UploadCloud, Loader2 } from "lucide-react";

const StudentEnrollmentModal = ({ classId, label }) => {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/students/class/${classId}`);
      if (response.data.success) {
        setStudents(response.data.students);
      }
    } catch (error) {
      handleError(error.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const openModal = async () => {
    setOpen(true);
    await loadStudents();
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFaceUpload = async (studentId, file) => {
    if (!file) return;

    setUploadingId(studentId);

    try {
      const image = await fileToDataUrl(file);
      const response = await axiosInstance.put(`/students/${studentId}/face`, { image });

      if (response.data.success) {
        setStudents((currentStudents) =>
          currentStudents.map((student) =>
            student._id === studentId
              ? { ...student, faceImage: image }
              : student
          )
        );
        handleSuccess("Student face enrolled successfully");
      }
    } catch (error) {
      handleError(error.response?.data?.message || "Failed to upload face image");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={openModal}
        className="group flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm border border-slate-200 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md"
      >
        <Camera size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
        Manage Faces
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="relative flex w-full max-w-4xl max-h-[90dvh] flex-col overflow-hidden rounded-[2.5rem] bg-[#f0f2f5] shadow-2xl"
            >
              {/* Dark Premium Header */}
              <div className="flex-shrink-0 bg-slate-900 px-6 py-6 sm:px-8 sm:py-8" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/10 shadow-inner backdrop-blur-md">
                      <Camera size={26} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight text-white">
                        Enroll Faces
                      </h3>
                      <p className="mt-1 text-sm font-medium text-slate-400">
                        {label}: Upload one clear reference image per student.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-white/20 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading classroom...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50">
                    <User size={48} className="text-slate-300 mb-4" />
                    <p className="text-sm font-bold text-slate-500">No students enrolled in this class yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {students.map((student, index) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={student._id}
                        className="group flex flex-col gap-5 rounded-[1.5rem] border border-white bg-white/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:bg-white/90 hover:shadow-md md:flex-row md:items-center md:justify-between"
                      >
                        {/* Student Info */}
                        <div className="flex items-center gap-5">
                          {student.faceImage ? (
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-[3px] border-emerald-100 shadow-sm">
                              <img
                                src={student.faceImage}
                                alt={`${student.name} reference`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-[3px] border-slate-100 bg-slate-50 text-slate-300">
                              <User size={28} />
                            </div>
                          )}

                          <div>
                            <h4 className="text-lg font-black text-slate-900 leading-tight">
                              {student.name}
                            </h4>
                            <div className="mt-1 flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md">Roll: {student.roll}</span>
                              <span className="truncate max-w-[150px] sm:max-w-xs">{student.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex flex-col items-start gap-3 md:items-end">
                          {/* Status Pill */}
                          <div
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-black uppercase tracking-wide ${
                              student.faceImage
                                ? "border-emerald-100/50 bg-emerald-50 text-emerald-600"
                                : "border-rose-100/50 bg-rose-50 text-rose-500"
                            }`}
                          >
                            {student.faceImage ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                            {student.faceImage ? "Face Enrolled" : "Missing Face"}
                          </div>

                          {/* Upload Button */}
                          <label className={`relative flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all md:w-auto md:min-w-[140px] ${
                            uploadingId === student._id 
                              ? "bg-slate-400 cursor-not-allowed" 
                              : "bg-slate-900 hover:bg-slate-800 hover:shadow-md"
                          }`}>
                            {uploadingId === student._id ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <UploadCloud size={16} />
                                {student.faceImage ? "Update Face" : "Upload Face"}
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              capture="user"
                              className="hidden"
                              disabled={uploadingId === student._id}
                              onChange={(event) =>
                                handleFaceUpload(student._id, event.target.files?.[0])
                              }
                            />
                          </label>
                        </div>
                      </motion.div>
                    ))}
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

export default StudentEnrollmentModal;