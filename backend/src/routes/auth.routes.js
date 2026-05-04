import express from 'express';
import { loginTeacher, registerTeacher, getMe, logoutTeacher, refreshTokenHandler } from '../controllers/auth.controller.js';
import { loginValidation, registerValidation } from '../middlewares/auth.middleware.js';
import verifyToken from '../middlewares/verifyToken.middleware.js';
const router = express.Router();

router.post('/register', registerValidation, registerTeacher);
router.post('/login',    loginValidation,    loginTeacher);
router.get('/me',        verifyToken,        getMe);
router.post('/logout',   verifyToken,        logoutTeacher);
router.get("/refresh", refreshTokenHandler);

export default router;