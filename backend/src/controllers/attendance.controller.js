import axios from "axios";
import Student from "../models/student.model.js";
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";
import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import fs from "fs";

const takeAttendance = async (req, res) => {
    try {
        const { classId, image } = req.body;

        // Get all students in class
        const students = await Student.find({ classId });
        if (students.length === 0) {
            return res.status(400).json({ success: false, message: "No students found in class" });
        }

        // Send image + students to FastAPI face recognition service
        // ← fixed payload keys to match FastAPI models
        const faceResponse = await axios.post("http://localhost:5001/recognize", {
            classroomImage: image,
            students: students.map(s => ({
                name: s.name,
                roll: s.roll,
                image: s.faceImage,   // ← was faceDescriptor
            })),
        });

        const recognizedRolls = faceResponse.data.recognized
            .filter(s => s.status === "Present")
            .map(s => s.roll);

        // Split students into present and absent
        const presentStudents = students.filter(s => recognizedRolls.includes(s.roll));
        const absentStudents  = students.filter(s => !recognizedRolls.includes(s.roll));

        // Save attendance to DB
        await Attendance.create({        // ← removed unused variable
            classId,
            teacherId: req.user.id,
            date: new Date(),
            presentStudents: presentStudents.map(s => s._id),
            absentStudents:  absentStudents.map(s => s._id),
        });

        // Update last attendance date on class
        await Class.findByIdAndUpdate(classId, { lastAttendance: new Date() });

        // Generate CSV
        const filePath = path.join("outputs", `attendance_${Date.now()}.csv`);
        if (!fs.existsSync("outputs")) fs.mkdirSync("outputs");

        const csvWriter = createObjectCsvWriter({
            path: filePath,
            header: [
                { id: "name",   title: "Name"   },
                { id: "roll",   title: "Roll"   },
                { id: "email",  title: "Email"  },
                { id: "status", title: "Status" },
            ],
        });

        const records = [
            ...presentStudents.map(s => ({ name: s.name, roll: s.roll, email: s.email, status: "Present" })),
            ...absentStudents.map(s  => ({ name: s.name, roll: s.roll, email: s.email, status: "Absent"  })),
        ];

        await csvWriter.writeRecords(records);

        // Send CSV as download then delete it
        res.download(filePath, `attendance_${new Date().toLocaleDateString()}.csv`, () => {
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export { takeAttendance };