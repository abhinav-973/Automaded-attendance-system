import express from "express";
import { takeAttendance } from "../controllers/attendance.controller.js";
import verifyToken from "../middlewares/verifyToken.middleware.js";

const router = express.Router();

router.post("/take", verifyToken, takeAttendance);  // ← verifyToken added

export default router;