import AuthSchema from "../models/auth.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  getRoleForEmail,
  normalizeEmail,
  syncResolvedRole,
} from "../utils/auth.util.js";
import { buildCookieOptions, buildClearCookieOptions } from "../config/env.js";

// =======================
// 🔑 TOKEN GENERATORS
// =======================

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }, // short-lived
  );

const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

// =======================
// 📝 REGISTER
// =======================

const registerTeacher = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const existingTeacher = await AuthSchema.findOne({
      email: normalizedEmail,
    });

    if (existingTeacher) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
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

// =======================
// 🔐 LOGIN
// =======================

const loginTeacher = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = normalizeEmail(email);

    const teacher = await AuthSchema.findOne({
      email: normalizedEmail,
    });

    if (!teacher) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const role = await syncResolvedRole(teacher);

    const accessToken = generateAccessToken({
      ...teacher.toObject(),
      role,
    });

    const refreshToken = generateRefreshToken(teacher);

    // 🍪 Set refresh token in httpOnly cookie (secure, cannot be accessed by JS)
    res.cookie("refreshToken", refreshToken, buildCookieOptions());

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =======================
// 👤 GET CURRENT USER
// =======================

const getMe = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false });
    }

    const teacher = await AuthSchema.findById(req.user.id);

    if (!teacher) {
      return res.status(404).json({ success: false });
    }

    const role = await syncResolvedRole(teacher);

    res.status(200).json({
      success: true,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        role,
      },
    });
  } catch {
    res.status(401).json({ success: false });
  }
};

// =======================
// 🔄 REFRESH TOKEN
// =======================

const refreshTokenHandler = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await AuthSchema.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ success: false });
    }

    const role = await syncResolvedRole(user);

    const newAccessToken = jwt.sign(
      { id: user._id, email: user.email, role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (err) {
    return res
      .status(403)
      .json({ success: false, message: "Invalid refresh token" });
  }
};

// =======================
// 🚪 LOGOUT
// =======================

const logoutTeacher = async (req, res) => {
  res.clearCookie("refreshToken", buildClearCookieOptions());

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// =======================
// 📤 EXPORTS
// =======================

export {
  registerTeacher,
  loginTeacher,
  getMe,
  refreshTokenHandler,
  logoutTeacher,
};
