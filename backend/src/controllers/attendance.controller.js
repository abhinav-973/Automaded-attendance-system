import axios from "axios";
import Student from "../models/student.model.js";
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";
import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import fs from "fs";
import { faceServiceUrl } from "../config/env.js";

const takeAttendance = async (req, res) => {
    try {
        const { classId, image } = req.body;

        if (!classId || !image) {
            return res.status(400).json({
                success: false,
                message: "classId and image are required",
            });
        }

        const classDoc = await Class.findOne({ _id: classId, teacherId: req.user.id });
        if (!classDoc) {
            return res.status(404).json({
                success: false,
                message: "Class not found for this teacher",
            });
        }

        const students = await Student.find({ classId });
        if (students.length === 0) {
            return res.status(400).json({ success: false, message: "No students found in class" });
        }

        const faceResponse = await axios.post(`${faceServiceUrl}/recognize`, {
            classroomImage: image,
            students: students.map((student) => ({
                name: student.name,
                roll: student.roll,
                modelIdentity: student.modelIdentity || null,
                image: student.faceImage || null,
            })),
        }, {
            timeout: 30000,
        });

        const recognizedRolls = faceResponse.data.recognized
            .filter((student) => student.status === "Present")
            .map((student) => student.roll);

        const presentStudents = students.filter((student) => recognizedRolls.includes(student.roll));
        const absentStudents = students.filter((student) => !recognizedRolls.includes(student.roll));

        await Attendance.create({
            classId,
            teacherId: req.user.id,
            date: new Date(),
            presentStudents: presentStudents.map((student) => student._id),
            absentStudents: absentStudents.map((student) => student._id),
        });

        await Class.findByIdAndUpdate(classId, { lastAttendance: new Date() });

        const filePath = path.join("outputs", `attendance_${Date.now()}.csv`);
        if (!fs.existsSync("outputs")) fs.mkdirSync("outputs");

        const csvWriter = createObjectCsvWriter({
            path: filePath,
            header: [
                { id: "name", title: "Name" },
                { id: "roll", title: "Roll" },
                { id: "email", title: "Email" },
                { id: "status", title: "Status" },
            ],
        });

        const records = [
            ...presentStudents.map((student) => ({
                name: student.name,
                roll: student.roll,
                email: student.email,
                status: "Present",
            })),
            ...absentStudents.map((student) => ({
                name: student.name,
                roll: student.roll,
                email: student.email,
                status: "Absent",
            })),
        ];

        await csvWriter.writeRecords(records);

        res.download(filePath, `attendance_${new Date().toLocaleDateString()}.csv`, () => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });
    } catch (error) {
        console.error(error);
        const detail = error.response?.data?.detail;
        res.status(500).json({
            success: false,
            message: detail || "Internal Server Error",
        });
    }
};

export { takeAttendance };
