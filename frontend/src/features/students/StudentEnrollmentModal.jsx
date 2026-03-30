import { useState } from "react";
import axiosInstance from "../../services/axiosInstance.js";
import { handleError, handleSuccess } from "../../utils/utils.js";

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
    if (!file) {
      return;
    }

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
      <button
        type="button"
        onClick={openModal}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
      >
        Manage Faces
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Enroll Student Faces
                </h3>
                <p className="text-sm text-slate-500">
                  {label}: upload one clear reference image per student.
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
                <p className="text-sm text-slate-500">Loading students...</p>
              ) : students.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No students found for this class.
                </p>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => (
                    <div
                      key={student._id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        {student.faceImage ? (
                          <img
                            src={student.faceImage}
                            alt={`${student.name} reference`}
                            className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            No Face
                          </div>
                        )}

                        <div>
                          <h4 className="text-base font-semibold text-slate-900">
                            {student.name}
                          </h4>
                          <p className="text-sm text-slate-500">Roll: {student.roll}</p>
                          <p className="text-sm text-slate-500">{student.email}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            student.faceImage
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {student.faceImage ? "Face Enrolled" : "Face Missing"}
                        </span>

                        <label className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                          {uploadingId === student._id ? "Uploading..." : "Upload Face"}
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentEnrollmentModal;
