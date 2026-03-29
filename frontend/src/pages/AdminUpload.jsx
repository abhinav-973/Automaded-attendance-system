import { useState } from "react";
import axios from "axios";
import { handleSuccess, handleError } from "../utils/utils.js";
import { ToastContainer } from "react-toastify";

const AdminUpload = () => {
  const [teacherFile, setTeacherFile] = useState(null);
  const [studentFile, setStudentFile] = useState(null);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);

  const uploadTeachers = async () => {
    if (!teacherFile) return handleError("Please select a file");
    setTeacherLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", teacherFile);
      const res = await axios.post(
        "http://localhost:3000/csv/upload-teachers",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.data.success) handleSuccess(res.data.message);
    } catch (error) {
      handleError(error.response?.data?.message || "Upload failed");
    } finally {
      setTeacherLoading(false);
    }
  };

  const uploadStudents = async () => {
    if (!studentFile) return handleError("Please select a file");
    setStudentLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", studentFile);
      const res = await axios.post(
        "http://localhost:3000/csv/upload-students",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.data.success) handleSuccess(res.data.message);
    } catch (error) {
      handleError(error.response?.data?.message || "Upload failed");
    } finally {
      setStudentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Panel</h1>
        <p className="text-sm text-gray-500 mb-8">
          Upload CSV files to populate the database.
          <br />
          ⚠️ Upload teachers first, then students.
        </p>

        {/* Upload Teachers */}
        <div className="mb-6 p-5 border border-gray-200 rounded-xl">
          <h2 className="text-base font-semibold text-gray-700 mb-1">
            📋 Teachers CSV
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Format: name, email, password, classes (separated by |)
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setTeacherFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500 mb-3
              file:mr-4 file:py-2 file:px-4 file:rounded-lg
              file:border-0 file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100 cursor-pointer"
          />
          {teacherFile && (
            <p className="text-xs text-green-600 mb-3">
              ✅ Selected: {teacherFile.name}
            </p>
          )}
          <button
            onClick={uploadTeachers}
            disabled={teacherLoading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white
              font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {teacherLoading ? "Uploading..." : "Upload Teachers"}
          </button>
        </div>

        {/* Upload Students */}
        <div className="p-5 border border-gray-200 rounded-xl">
          <h2 className="text-base font-semibold text-gray-700 mb-1">
            🎓 Students CSV
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Format: name, roll, email, class
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setStudentFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500 mb-3
              file:mr-4 file:py-2 file:px-4 file:rounded-lg
              file:border-0 file:text-sm file:font-semibold
              file:bg-green-50 file:text-green-700
              hover:file:bg-green-100 cursor-pointer"
          />
          {studentFile && (
            <p className="text-xs text-green-600 mb-3">
              ✅ Selected: {studentFile.name}
            </p>
          )}
          <button
            onClick={uploadStudents}
            disabled={studentLoading}
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white
              font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {studentLoading ? "Uploading..." : "Upload Students"}
          </button>
        </div>

        <ToastContainer />
      </div>
    </div>
  );
};

export default AdminUpload;