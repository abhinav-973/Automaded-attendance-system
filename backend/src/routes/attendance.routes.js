import express from "express";
import { takeAttendance } from "../controllers/attendance.controller.js";
import verifyToken from "../middlewares/verifyToken.middleware.js";
import { downloadAttendanceReport } from "../controllers/report.controller.js";
const router = express.Router();

router.post("/take", verifyToken, takeAttendance); // ← verifyToken added
router.get("/report/:attendanceId", verifyToken, downloadAttendanceReport);
export default router;
