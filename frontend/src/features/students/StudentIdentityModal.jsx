import { useState } from "react";
import axiosInstance from "../../services/axiosInstance.js";
import { handleError, handleSuccess } from "../../utils/utils.js";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, X, CheckCircle2, AlertCircle, Save, Loader2, Database, Search, Cpu } from "lucide-react";

const normalizeIdentity = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");

const StudentIdentityModal = ({
  classId,
  label,
  triggerLabel = "Map Model Names",
}) => {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [identities, setIdentities] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [identityLoadError, setIdentityLoadError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setIdentityLoadError("");

    try {
      const studentsResponse = await axiosInstance.get(`/students/class/${classId}`);
      const nextStudents = studentsResponse.data.success ? studentsResponse.data.students : [];

      setStudents(nextStudents);
      setDrafts(
        nextStudents.reduce((accumulator, student) => {
          accumulator[student._id] = student.modelIdentity || student.name || "";
          return accumulator;
        }, {})
      );

      try {
        const identitiesResponse = await axiosInstance.get("/students/model-identities");
        const nextIdentities = identitiesResponse.data.success
          ? identitiesResponse.data.identities
          : [];
        setIdentities(nextIdentities);
      } catch (error) {
        setIdentities([]);
        setIdentityLoadError(
          error.response?.data?.message ||
            "Could not load model suggestions. Type the exact model manually."
        );
      }
    } catch (error) {
      setStudents([]);
      setIdentities([]);
      handleError(error.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const openModal = async () => {
    setOpen(true);
    await loadData();
  };

  const updateDraft = (studentId, value) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [studentId]: value,
    }));
  };

  const saveIdentity = async (studentId) => {
    setSavingId(studentId);

    try {
      const modelIdentity = drafts[studentId]?.trim() || "";
      const response = await axiosInstance.put(`/students/${studentId}/model-identity`, {
        modelIdentity,
      });

      if (response.data.success) {
        setStudents((currentStudents) =>
          currentStudents.map((student) =>
            student._id === studentId
              ? { ...student, modelIdentity: modelIdentity || null }
              : student
          )
        );
        handleSuccess(response.data.message);
      }
    } catch (error) {
      handleError(error.response?.data?.message || "Failed to save model identity");
    } finally {
      setSavingId(null);
    }
  };

  const datalistId = `model-identities-${classId}`;
  const normalizedIdentities = new Set(identities.map(normalizeIdentity));

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="group flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm border border-slate-200 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      >
        <Fingerprint size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
        {triggerLabel}
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* CRITICAL CHANGE: max-w-md restricts width tightly, max-h-[85vh] ensures it fits vertically */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0 }}
              className="relative flex w-full max-w-md max-h-[85vh] flex-col overflow-hidden rounded-[1.25rem] bg-[#f0f2f5] shadow-2xl"
            >
              {/* Compact Header */}
              <div className="flex-shrink-0 bg-slate-900 p-4" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/10 shadow-inner backdrop-blur-md">
                      <Cpu size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-white leading-tight">
                        Map Identities
                      </h3>
                      <p className="text-[11px] font-medium text-slate-400 line-clamp-1">
                        Link students to classifier names.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-white/20 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Compact Body */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-blue-500 mb-2" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-slate-300 bg-slate-50">
                    <Database size={24} className="text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-500">No students found.</p>
                  </div>
                ) : (
                  <>
                    {identityLoadError && (
                      <div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-800 shadow-sm">
                        <AlertCircle size={14} className="shrink-0 text-rose-500" />
                        <p className="text-[11px] font-medium leading-tight">{identityLoadError}</p>
                      </div>
                    )}

                    <div className="mb-3 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 backdrop-blur-sm shadow-sm">
                      <p className="text-xs text-slate-600 font-medium">
                        Available Identities
                      </p>
                      <span className="font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-xs">
                        {identities.length}
                      </span>
                    </div>

                    <datalist id={datalistId}>
                      {identities.map((identity) => (
                        <option key={identity} value={identity} />
                      ))}
                    </datalist>

                    <div className="grid gap-2.5">
                      {students.map((student) => {
                        const currentValue = drafts[student._id] ?? "";
                        const isKnownIdentity = normalizedIdentities.has(
                          normalizeIdentity(currentValue)
                        );

                        return (
                          <div
                            key={student._id}
                            className="flex flex-col gap-2 rounded-xl border border-white bg-white/80 p-3 shadow-sm backdrop-blur-md transition-all hover:bg-white"
                          >
                            {/* Card Header: Name & Status */}
                            <div className="flex flex-col gap-1.5">
                              <h4 className="text-[13px] font-black text-slate-900 leading-tight truncate">
                                {student.name} <span className="text-xs font-semibold text-slate-400">({student.roll})</span>
                              </h4>
                              
                              <div className="flex flex-wrap gap-1.5">
                                <span
                                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                    isKnownIdentity
                                      ? "bg-emerald-50 text-emerald-600"
                                      : "bg-amber-50 text-amber-600"
                                  }`}
                                >
                                  {isKnownIdentity ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                  {isKnownIdentity ? "Mapped" : "Unmapped"}
                                </span>

                                {student.modelIdentity && (
                                  <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-600 truncate max-w-[150px]">
                                    <CheckCircle2 size={10} className="shrink-0" />
                                    {student.modelIdentity}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Combined Input & Save Button Group */}
                            <div className="flex w-full mt-0.5">
                              <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                                  <Search size={12} />
                                </div>
                                <input
                                  type="text"
                                  list={datalistId}
                                  value={currentValue}
                                  onChange={(event) => updateDraft(student._id, event.target.value)}
                                  placeholder="Type exact identity..."
                                  className="w-full rounded-l-lg border border-r-0 border-slate-200 bg-white/50 pl-7 pr-2 py-1.5 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/10 placeholder:text-slate-400"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => saveIdentity(student._id)}
                                disabled={savingId === student._id}
                                className="flex shrink-0 items-center justify-center gap-1 rounded-r-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed"
                              >
                                {savingId === student._id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Save size={12} />
                                )}
                                Save
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StudentIdentityModal;