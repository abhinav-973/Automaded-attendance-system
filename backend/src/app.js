import express from 'express';
import cors from 'cors';
import router from './routes/auth.routes.js';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import csvRouter from './routes/csv.routes.js';
import attendanceRouter from "./routes/attendance.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js"; // ← add

const app = express();

app.use(cookieParser());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use('/auth',       router);
app.use('/csv',        csvRouter);
app.use('/attendance', attendanceRouter);
app.use('/dashboard',  dashboardRouter); // ← add

export default app;