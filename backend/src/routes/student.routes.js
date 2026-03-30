import express from "express";
import verifyToken from "../middlewares/verifyToken.middleware.js";
import {
    enrollStudentFace,
    getAvailableModelIdentities,
    getStudentsByClass,
    updateStudentModelIdentity,
} from "../controllers/student.controller.js";

const router = express.Router();

router.get("/model-identities", verifyToken, getAvailableModelIdentities);
router.get("/class/:classId", verifyToken, getStudentsByClass);
router.put("/:studentId/model-identity", verifyToken, updateStudentModelIdentity);
router.put("/:studentId/face", verifyToken, enrollStudentFace);

export default router;
