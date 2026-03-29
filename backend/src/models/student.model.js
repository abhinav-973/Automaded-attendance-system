import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    roll: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        required: true,
    },
    faceImage: {
        type: String,   // ← base64 encoded face image (was faceDescriptor)
        default: null,
    },
}, { timestamps: true });

const Student = mongoose.model("Student", studentSchema);
export default Student;