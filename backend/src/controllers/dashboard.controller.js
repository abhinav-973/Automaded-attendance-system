import Class from "../models/class.model.js";
import Attendance from "../models/attendance.model.js";

const getClasses = async (req, res) => {
    try {
        const classes = await Class.find({ teacherId: req.user.id });
        res.status(200).json({ success: true, classes });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getRecentAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find({ teacherId: req.user.id })
            .populate("classId", "name")
            .sort({ date: -1 })
            .limit(10);
        res.status(200).json({ success: true, attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export { getClasses, getRecentAttendance };