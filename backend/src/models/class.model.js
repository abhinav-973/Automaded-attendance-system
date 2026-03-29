import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
    name: { type: String, required: true },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth",
        required: true,
    },
    totalStudents: { type: Number, default: 0 },
    lastAttendance: { type: Date, default: null },
}, { timestamps: true });

const Class = mongoose.model("Class", classSchema);
export default Class;