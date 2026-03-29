import express from 'express';
import { loginTeacher, registerTeacher, getMe, logoutTeacher } from '../controllers/auth.controller.js';
import { loginValidation, registerValidation } from '../middlewares/auth.middleware.js';
import verifyToken from '../middlewares/verifyToken.middleware.js';

const router = express.Router();

router.post('/register', registerValidation, registerTeacher);
router.post('/login',    loginValidation,    loginTeacher);
router.get('/me',        verifyToken,        getMe);
router.post('/logout',   verifyToken,        logoutTeacher);

export default router;