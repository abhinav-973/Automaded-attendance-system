import Class from "../models/class.model.js";
import Attendance from "../models/attendance.model.js";
import Student from "../models/student.model.js";

const getClasses = async (req, res) => {
    try {
        const classes = await Class.find({ teacherId: req.user.id }).lean();
        const classIds = classes.map((classDoc) => classDoc._id);

        const studentCounts = await Student.aggregate([
            {
                $match: {
                    classId: { $in: classIds },
                },
            },
            {
                $group: {
                    _id: "$classId",
                    totalStudents: { $sum: 1 },
                    mappedStudents: {
                        $sum: {
                            $cond: [
                                {
                                    $gt: [
                                        {
                                            $strLenCP: {
                                                $trim: {
                                                    input: { $ifNull: ["$modelIdentity", ""] },
                                                },
                                            },
                                        },
                                        0,
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);

        const countsByClassId = new Map(
            studentCounts.map((entry) => [String(entry._id), entry])
        );

        const classesWithSetup = classes.map((classDoc) => {
            const counts = countsByClassId.get(String(classDoc._id));
            const totalStudents = counts?.totalStudents ?? classDoc.totalStudents ?? 0;
            const mappedStudents = counts?.mappedStudents ?? 0;
            const unmappedStudents = Math.max(totalStudents - mappedStudents, 0);

            return {
                ...classDoc,
                totalStudents,
                mappedStudents,
                unmappedStudents,
                needsModelMapping: totalStudents > 0 && unmappedStudents > 0,
            };
        });

        res.status(200).json({ success: true, classes: classesWithSetup });
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
