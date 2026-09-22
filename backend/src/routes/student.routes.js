import express from "express";
import verifyToken from "../middlewares/verifyToken.middleware.js";
import {
    getAvailableModelIdentities,
    getStudentsByClass,
    updateStudentModelIdentity,
} from "../controllers/student.controller.js";

const router = express.Router();

router.get("/model-identities", verifyToken, getAvailableModelIdentities);
router.get("/class/:classId", verifyToken, getStudentsByClass);
router.put("/:studentId/model-identity", verifyToken, updateStudentModelIdentity);

export default router;
