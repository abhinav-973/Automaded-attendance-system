import AuthSchema from "../models/auth.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { buildClearCookieOptions, buildCookieOptions } from "../config/env.js";
import { getRoleForEmail, normalizeEmail, syncResolvedRole } from "../utils/auth.util.js";

const registerTeacher = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);

        const existingTeacher = await AuthSchema.findOne({ email: normalizedEmail });
        if (existingTeacher) {
            return res.status(400).json({ success: false, message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const role = getRoleForEmail(normalizedEmail);

        const newTeacher = new AuthSchema({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role,
        });

        await newTeacher.save();

        res.status(201).json({
            success: true,
            message: "Teacher registered successfully",
            teacher: {
                id: newTeacher._id,
                name: newTeacher.name,
                email: newTeacher.email,
                role: newTeacher.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const loginTeacher = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);

        const teacher = await AuthSchema.findOne({ email: normalizedEmail });
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        const isMatch = await bcrypt.compare(password, teacher.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const role = await syncResolvedRole(teacher);
        const token = jwt.sign(
            { id: teacher._id, email: teacher.email, role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, buildCookieOptions());

        res.status(200).json({
            success: true,
            message: "Login successful",
            teacher: {
                id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getMe = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const teacher = await AuthSchema.findById(req.user.id);
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        const role = await syncResolvedRole(teacher);

        res.status(200).json({
            success: true,
            teacher: {
                id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                role,
                createdAt: teacher.createdAt,
                updatedAt: teacher.updatedAt,
            },
        });
    } catch (error) {
        res.status(401).json({ success: false, message: "Unauthorized" });
    }
};

const logoutTeacher = async (req, res) => {
    res.clearCookie("token", buildClearCookieOptions());
    res.status(200).json({ success: true, message: "Logged out successfully" });
};

export { loginTeacher, registerTeacher, getMe, logoutTeacher };
