import express from "express";
import { getClasses, getRecentAttendance } from "../controllers/dashboard.controller.js";
import verifyToken from "../middlewares/verifyToken.middleware.js";

const router = express.Router();

router.get("/classes",           verifyToken, getClasses);
router.get("/recent-attendance", verifyToken, getRecentAttendance);

export default router;