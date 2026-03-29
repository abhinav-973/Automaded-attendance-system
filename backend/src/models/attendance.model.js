import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        required: true,
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth",
        required: true,
    },
    date: { type: Date, required: true },
    presentStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
    }],
    absentStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
    }],
}, { timestamps: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;