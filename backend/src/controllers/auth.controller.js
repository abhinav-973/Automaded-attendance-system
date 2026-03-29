import AuthSchema from "../models/auth.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const registerTeacher = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingTeacher = await AuthSchema.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({ success: false, message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newTeacher = new AuthSchema({
            name,
            email,
            password: hashedPassword,
        });

        await newTeacher.save();

        res.status(201).json({ success: true, message: "Teacher registered successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const loginTeacher = async (req, res) => {
    try {
        const { email, password } = req.body;

        const teacher = await AuthSchema.findOne({ email });
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        const isMatch = await bcrypt.compare(password, teacher.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: teacher._id, email: teacher.email, role: "teacher" },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            teacher: {
                id: teacher._id,
                name: teacher.name,
                email: teacher.email,
            },
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getMe = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const teacher = await AuthSchema.findById(decoded.id).select("-password");
        res.status(200).json({ success: true, teacher });
    } catch (error) {
        res.status(401).json({ success: false, message: "Unauthorized" });
    }
};

const logoutTeacher = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
};

export { loginTeacher, registerTeacher, getMe, logoutTeacher };