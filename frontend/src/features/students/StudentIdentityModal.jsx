import { useState } from "react";
import axiosInstance from "../../services/axiosInstance.js";
import { handleError, handleSuccess } from "../../utils/utils.js";

const normalizeIdentity = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");

const StudentIdentityModal = ({ classId, label }) => {
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
            "Could not load model suggestions. Restart the face service and try again, or type the exact model name manually."
        );
      }
    } catch (error) {
      setStudents([]);
      setIdentities([]);
      handleError(error.response?.data?.message || "Failed to load students for this class");
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
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
      >
        Map Model Names
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Map Class Students To Model Identities
                </h3>
                <p className="text-sm text-slate-500">
                  {label}: choose the exact name used inside the imported classifier for each student.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-3 py-1 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              {loading ? (
                <p className="text-sm text-slate-500">Loading students and model identities...</p>
              ) : students.length === 0 ? (
                <p className="text-sm text-slate-500">No students found for this class.</p>
              ) : (
                <>
                  {identityLoadError && (
                    <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      {identityLoadError}
                    </p>
                  )}

                  <p className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Model identities available: <span className="font-semibold">{identities.length}</span>
                    . Start typing to search, then save each row.
                  </p>

                  <datalist id={datalistId}>
                    {identities.map((identity) => (
                      <option key={identity} value={identity} />
                    ))}
                  </datalist>

                  <div className="space-y-3">
                    {students.map((student) => {
                      const currentValue = drafts[student._id] ?? "";
                      const isKnownIdentity = normalizedIdentities.has(
                        normalizeIdentity(currentValue)
                      );

                      return (
                        <div
                          key={student._id}
                          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div>
                            <h4 className="text-base font-semibold text-slate-900">
                              {student.name}
                            </h4>
                            <p className="text-sm text-slate-500">Roll: {student.roll}</p>
                            <p className="text-sm text-slate-500">{student.email}</p>
                          </div>

                          <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <input
                              type="text"
                              list={datalistId}
                              value={currentValue}
                              onChange={(event) => updateDraft(student._id, event.target.value)}
                              placeholder="Type the model identity name"
                              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-500"
                            />

                            <button
                              type="button"
                              onClick={() => saveIdentity(student._id)}
                              disabled={savingId === student._id}
                              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                            >
                              {savingId === student._id ? "Saving..." : "Save"}
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs">
                            <span
                              className={`rounded-full px-3 py-1 font-semibold ${
                                isKnownIdentity
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {isKnownIdentity ? "Matches imported model" : "Needs exact model name"}
                            </span>

                            {student.modelIdentity && (
                              <span className="rounded-full bg-slate-200 px-3 py-1 font-semibold text-slate-700">
                                Saved: {student.modelIdentity}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentIdentityModal;
