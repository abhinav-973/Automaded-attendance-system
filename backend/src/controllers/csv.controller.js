import fs from "fs";
import csv from "csv-parser";
import AuthSchema from "../models/auth.model.js";
import Class from "../models/class.model.js";
import Student from "../models/student.model.js";
import bcrypt from "bcryptjs";

// Upload and parse teachers.csv
const uploadTeachers = async (req, res) => {
    try {
        const results = [];

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", async () => {
                try {
                    for (const row of results) {
                        const hashedPassword = await bcrypt.hash(row.password, 10);
                        const teacher = await AuthSchema.findOneAndUpdate(
                            { email: row.email },
                            { name: row.name, email: row.email, password: hashedPassword },
                            { upsert: true, returnDocument: 'after' }  // ← fixed
                        );

                        const classNames = row.classes.split("|");
                        for (const className of classNames) {
                            await Class.findOneAndUpdate(
                                { name: className.trim(), teacherId: teacher._id },
                                { name: className.trim(), teacherId: teacher._id },
                                { upsert: true, returnDocument: 'after' }  // ← fixed
                            );
                        }
                    }

                    fs.unlinkSync(req.file.path);
                    res.status(200).json({ success: true, message: "Teachers uploaded successfully" });

                } catch (error) {
                    console.error(error);
                    res.status(500).json({ success: false, message: "Failed to process teachers CSV" });
                }
            });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Upload and parse students.csv
const uploadStudents = async (req, res) => {
    try {
        const results = [];

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", async () => {
                try {
                    for (const row of results) {
                        const classDoc = await Class.findOne({ name: row.class.trim() });
                        if (!classDoc) continue;

                        await Student.findOneAndUpdate(
                            { roll: row.roll },
                            {
                                name:    row.name,
                                roll:    row.roll,
                                email:   row.email,
                                classId: classDoc._id,
                            },
                            { upsert: true, returnDocument: 'after' }  // ← fixed
                        );

                        const count = await Student.countDocuments({ classId: classDoc._id });
                        await Class.findByIdAndUpdate(classDoc._id, { totalStudents: count });
                    }

                    fs.unlinkSync(req.file.path);
                    res.status(200).json({ success: true, message: "Students uploaded successfully" });

                } catch (error) {
                    console.error(error);
                    res.status(500).json({ success: false, message: "Failed to process students CSV" });
                }
            });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export { uploadTeachers, uploadStudents };