import express from "express";
import multer from "multer";
import fs from "fs";
import { uploadTeachers, uploadStudents } from "../controllers/csv.controller.js";
import verifyToken from "../middlewares/verifyToken.middleware.js";
import requireAdmin from "../middlewares/requireAdmin.middleware.js";

const router = express.Router();

if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

const upload = multer({ dest: "uploads/" });

router.post("/upload-teachers", verifyToken, requireAdmin, upload.single("file"), uploadTeachers);
router.post("/upload-students", verifyToken, requireAdmin, upload.single("file"), uploadStudents);

export default router;
