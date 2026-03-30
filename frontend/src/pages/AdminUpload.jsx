import { useState } from "react";
import axiosInstance from "../services/axiosInstance.js";
import { handleSuccess, handleError } from "../utils/utils.js";

const AdminUpload = () => {
  const [teacherFile, setTeacherFile] = useState(null);
  const [studentFile, setStudentFile] = useState(null);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);

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
      }
    } catch (error) {
      handleError(error.response?.data?.message || "Upload failed");
    } finally {
      setStudentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-gray-800">Admin Panel</h1>
        <p className="mb-8 text-sm text-gray-500">
          Upload CSV files to populate the database.
          <br />
          Upload teachers first, then students.
          <br />
          Students CSV can include optional <code>teacherEmail</code> and <code>modelIdentity</code> columns.
        </p>

        <div className="mb-6 rounded-2xl border border-gray-200 p-5">
          <h2 className="mb-1 text-base font-semibold text-gray-700">Teachers CSV</h2>
          <p className="mb-3 text-xs text-gray-400">
            Format: name, email, password, classes (separated by |), optional role
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(event) => setTeacherFile(event.target.files?.[0] || null)}
            className="mb-3 block w-full cursor-pointer text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />
          {teacherFile && (
            <p className="mb-3 text-xs text-green-600">
              Selected: {teacherFile.name}
            </p>
          )}
          <button
            onClick={uploadTeachers}
            disabled={teacherLoading}
            className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {teacherLoading ? "Uploading..." : "Upload Teachers"}
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 p-5">
          <h2 className="mb-1 text-base font-semibold text-gray-700">Students CSV</h2>
          <p className="mb-3 text-xs text-gray-400">
            Format: name, roll, email, class, optional teacherEmail, optional modelIdentity
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(event) => setStudentFile(event.target.files?.[0] || null)}
            className="mb-3 block w-full cursor-pointer text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-green-700 hover:file:bg-green-100"
          />
          {studentFile && (
            <p className="mb-3 text-xs text-green-600">
              Selected: {studentFile.name}
            </p>
          )}
          <button
            onClick={uploadStudents}
            disabled={studentLoading}
            className="w-full rounded-lg bg-green-600 py-2 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {studentLoading ? "Uploading..." : "Upload Students"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUpload;
