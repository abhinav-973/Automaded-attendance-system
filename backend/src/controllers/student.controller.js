import axios from "axios";
import Class from "../models/class.model.js";
import Student from "../models/student.model.js";
import { faceServiceUrl } from "../config/env.js";

const getStudentsByClass = async (req, res) => {
    try {
        const { classId } = req.params;

        const classDoc = await Class.findOne({ _id: classId, teacherId: req.user.id });
        if (!classDoc) {
            return res.status(404).json({
                success: false,
                message: "Class not found for this teacher",
            });
        }

        const students = await Student.find({ classId }).sort({ roll: 1 });
        res.status(200).json({ success: true, students });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const enrollStudentFace = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                message: "image is required",
            });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        const classDoc = await Class.findOne({ _id: student.classId, teacherId: req.user.id });
        if (!classDoc) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update this student",
            });
        }

        student.faceImage = image;
        await student.save();

        res.status(200).json({
            success: true,
            message: "Student face enrolled successfully",
            student,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const updateStudentModelIdentity = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { modelIdentity } = req.body;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        const classDoc = await Class.findOne({ _id: student.classId, teacherId: req.user.id });
        if (!classDoc) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update this student",
            });
        }

        student.modelIdentity = modelIdentity?.trim() || null;
        await student.save();

        res.status(200).json({
            success: true,
            message: student.modelIdentity
                ? "Model identity updated successfully"
                : "Model identity cleared successfully",
            student,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getAvailableModelIdentities = async (req, res) => {
    try {
        const response = await axios.get(`${faceServiceUrl}/identities`, {
            timeout: 30000,
        });

        res.status(200).json({
            success: true,
            identities: response.data.identities || [],
            total: response.data.total || 0,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.response?.data?.detail || "Failed to load model identities",
        });
    }
};

export {
    getStudentsByClass,
    enrollStudentFace,
    updateStudentModelIdentity,
    getAvailableModelIdentities,
};
