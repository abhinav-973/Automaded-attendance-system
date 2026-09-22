import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import fs from "fs";

import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";
import Student from "../models/student.model.js";

const downloadAttendanceReport = async (req, res) => {
    let filePath = null;

    try {
        const { attendanceId } = req.params;

        // 1. Find attendance record belonging to the logged-in teacher
        const attendance = await Attendance.findOne({
            _id: attendanceId,
            teacherId: req.user.id,
        });

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found",
            });
        }

        // 2. Find the class
        const classDoc = await Class.findOne({
            _id: attendance.classId,
            teacherId: req.user.id,
        });

        if (!classDoc) {
            return res.status(404).json({
                success: false,
                message: "Class not found",
            });
        }

        // 3. Get all students belonging to this class
        const students = await Student.find({
            classId: attendance.classId,
        }).lean();

        if (students.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No students found in this class",
            });
        }

        // 4. Create a Set of present student IDs
        const presentSet = new Set(
            attendance.presentStudents.map((id) => id.toString())
        );

        // 5. Prepare CSV records
        const records = students.map((student) => ({
            name: student.name,
            roll: student.roll,
            email: student.email,
            status: presentSet.has(student._id.toString())
                ? "Present"
                : "Absent",
        }));

        // 6. Create temporary output directory
        const outputDirectory = path.join(process.cwd(), "outputs");

        if (!fs.existsSync(outputDirectory)) {
            fs.mkdirSync(outputDirectory, { recursive: true });
        }

        // 7. Create unique temporary CSV filename
        filePath = path.join(
            outputDirectory,
            `attendance_${attendanceId}_${Date.now()}.csv`
        );

        // 8. User-facing download filename
        const reportDate = new Date(attendance.date)
            .toISOString()
            .slice(0, 10);

        const safeClassName = classDoc.name
            .replace(/[^a-zA-Z0-9_-]/g, "_");

        const fileName = `attendance_${safeClassName}_${reportDate}.csv`;

        // 9. Generate CSV
        const csvWriter = createObjectCsvWriter({
            path: filePath,
            header: [
                { id: "name", title: "Name" },
                { id: "roll", title: "Roll" },
                { id: "email", title: "Email" },
                { id: "status", title: "Status" },
            ],
        });

        await csvWriter.writeRecords(records);

        // 10. Send CSV to teacher
        res.download(filePath, fileName, (error) => {
            // Always remove temporary CSV after download attempt
            if (filePath && fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            if (error && !res.headersSent) {
                console.error(
                    "Failed to send attendance report:",
                    error
                );

                res.status(500).json({
                    success: false,
                    message: "Failed to download attendance report",
                });
            }
        });

    } catch (error) {
        console.error(
            "Failed to generate attendance report:",
            error
        );

        // Clean up CSV if something failed after file creation
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (cleanupError) {
                console.error(
                    "Failed to clean up temporary report:",
                    cleanupError
                );
            }
        }

        // Handle invalid MongoDB ObjectId
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid attendance ID",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to generate attendance report",
        });
    }
};

export {
    downloadAttendanceReport,
};