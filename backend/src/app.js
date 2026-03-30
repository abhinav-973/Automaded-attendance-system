import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/auth.routes.js";
import csvRouter from "./routes/csv.routes.js";
import attendanceRouter from "./routes/attendance.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import studentRouter from "./routes/student.routes.js";
import { corsOriginHandler } from "./config/env.js";

const app = express();

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: corsOriginHandler,
    credentials: true,
}));

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use("/auth", router);
app.use("/csv", csvRouter);
app.use("/attendance", attendanceRouter);
app.use("/dashboard", dashboardRouter);
app.use("/students", studentRouter);

export default app;
