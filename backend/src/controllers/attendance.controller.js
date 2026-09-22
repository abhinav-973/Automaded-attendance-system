import axios from "axios";
import Student from "../models/student.model.js";
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";
import { faceServiceTimeoutMs, faceServiceUrl } from "../config/env.js";

const takeAttendance = async (req, res) => {
  try {
    const { classId, image, images } = req.body;
    const classroomImages = Array.isArray(images)
      ? images.filter(Boolean)
      : image
        ? [image]
        : [];

    if (!classId || classroomImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "classId and at least one image are required",
      });
    }

    const classDoc = await Class.findOne({
      _id: classId,
      teacherId: req.user.id,
    });
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found for this teacher",
      });
    }

    const students = await Student.find({ classId });
    if (students.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No students found in class" });
    }

    const studentPayload = students.map((student) => ({
      name: student.name,
      roll: student.roll,
      modelIdentity: student.modelIdentity || null,
    }));

    const recognitionResponses = await Promise.all(
      classroomImages.map((classroomImage) =>
        axios.post(
          `${faceServiceUrl}/recognize`,
          {
            classroomImage,
            students: studentPayload,
          },
          {
            timeout: faceServiceTimeoutMs,
          },
        ),
      ),
    );

    const recognizedRolls = new Set();

    for (const recognitionResponse of recognitionResponses) {
      for (const student of recognitionResponse.data.recognized || []) {
        if (student.status === "Present") {
          recognizedRolls.add(student.roll);
        }
      }
    }

    const presentStudents = students.filter((student) =>
      recognizedRolls.has(student.roll),
    );
    const absentStudents = students.filter(
      (student) => !recognizedRolls.has(student.roll),
    );

    const attendance = await Attendance.create({
      classId,
      teacherId: req.user.id,
      date: new Date(),
      presentStudents: presentStudents.map((student) => student._id),
      absentStudents: absentStudents.map((student) => student._id),
    });

    await Class.findOneAndUpdate(
      {
        _id: classId,
        teacherId: req.user.id,
      },
      {
        lastAttendance: attendance.date,
        lastAttendanceId: attendance._id,
      },
    );

    return res.status(201).json({
      success: true,
      message: "Attendance taken successfully",
      attendanceId: attendance._id,
    });
  } catch (error) {
    console.error("Failed to take attendance:", error);
    const isFaceServiceTimeout =
      axios.isAxiosError(error) && error.code === "ECONNABORTED";
    const isFaceServiceUnavailable =
      axios.isAxiosError(error) &&
      !error.response &&
      ["ECONNREFUSED", "ENOTFOUND", "ECONNRESET", "ETIMEDOUT"].includes(
        error.code,
      );
    const detail = error.response?.data?.detail;

    if (detail) {
      return res.status(500).json({ success: false, message: detail });
    }

    if (isFaceServiceTimeout) {
      return res.status(504).json({
        success: false,
        message: `Face recognition took longer than ${Math.round(
          faceServiceTimeoutMs / 1000,
        )} seconds. Try again or increase FACE_SERVICE_TIMEOUT_MS.`,
      });
    }

    if (isFaceServiceUnavailable) {
      return res.status(502).json({
        success: false,
        message:
          "Face recognition service is not reachable. Start the face service or set FACE_SERVICE_URL in Render.",
      });
    }

    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export { takeAttendance };
