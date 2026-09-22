import fs from "fs";
import csv from "csv-parser";
import bcrypt from "bcryptjs";
import AuthSchema from "../models/auth.model.js";
import Class from "../models/class.model.js";
import Student from "../models/student.model.js";
import { getRoleForEmail, normalizeEmail } from "../utils/auth.util.js";

const normalizeName = (name = "") =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

const readCsvRows = (filePath) =>
  new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });

const removeTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const resolveStudentClass = async (row) => {
  const className = row.class?.trim();
  if (!className) {
    return null;
  }

  const query = { name: className };

  if (row.teacherEmail) {
    const teacher = await AuthSchema.findOne({
      email: normalizeEmail(row.teacherEmail),
    });
    if (!teacher) {
      throw new Error(
        `Teacher '${row.teacherEmail}' not found for class '${className}'`,
      );
    }
    query.teacherId = teacher._id;
  }

  const classes = await Class.find(query);

  if (classes.length > 1 && !row.teacherEmail) {
    throw new Error(
      `Class '${className}' is ambiguous. Add a teacherEmail column to the students CSV.`,
    );
  }

  return classes[0] || null;
};

const uploadTeachers = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "CSV file is required" });
  }

  try {
    const rows = await readCsvRows(req.file.path);

    for (const row of rows) {
      if (!row.name || !row.email || !row.password) {
        continue;
      }

      const email = normalizeEmail(row.email);
      const hashedPassword = await bcrypt.hash(row.password, 10);
      const requestedRole = row.role?.trim().toLowerCase();
      const role = requestedRole === "admin" ? "admin" : getRoleForEmail(email);

      const teacher = await AuthSchema.findOneAndUpdate(
        { email },
        { name: row.name.trim(), email, password: hashedPassword, role },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      const classNames = (row.classes || "")
        .split("|")
        .map((className) => className.trim())
        .filter(Boolean);

      for (const className of classNames) {
        await Class.findOneAndUpdate(
          { name: className, teacherId: teacher._id },
          { name: className, teacherId: teacher._id },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
      }
    }

    res
      .status(200)
      .json({ success: true, message: "Teachers uploaded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process teachers CSV",
    });
  } finally {
    removeTempFile(req.file.path);
  }
};

const uploadStudents = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "CSV file is required" });
  }

  try {
    const rows = await readCsvRows(req.file.path);
    const touchedClassIds = new Set();

    for (const row of rows) {
      if (!row.name || !row.roll || !row.email) {
        continue;
      }

      const classDoc = await resolveStudentClass(row);
      if (!classDoc) {
        continue;
      }

      const update = {
        name: row.name.trim(),
        roll: row.roll.trim(),
        email: normalizeEmail(row.email),
        classId: classDoc._id,
      };

      const faceServiceUrl =
        process.env.FACE_SERVICE_URL || "http://localhost:5001";

      let identityMap = new Map();

      try {
        const identityResponse = await axios.get(
          `${faceServiceUrl}/identities`,
        );

        const identities = identityResponse.data.identities || [];

        identityMap = new Map(
          identities.map((identity) => [normalizeName(identity), identity]),
        );
      } catch (error) {
        console.warn(
          "Could not fetch model identities. Automatic mapping skipped.",
        );
      }

      const providedIdentity =
        row.modelIdentity || row.modelName || row.identity;

      if (providedIdentity?.trim()) {
        // If CSV explicitly provides modelIdentity, use it.
        update.modelIdentity = providedIdentity.trim();
      } else {
        // Otherwise try to match the student's name automatically.
        const matchedIdentity = identityMap.get(normalizeName(row.name));

        if (matchedIdentity) {
          update.modelIdentity = matchedIdentity;
        }
      }

      await Student.findOneAndUpdate({ roll: row.roll.trim() }, update, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      });

      touchedClassIds.add(String(classDoc._id));
    }

    for (const classId of touchedClassIds) {
      const count = await Student.countDocuments({ classId });
      await Class.findByIdAndUpdate(classId, { totalStudents: count });
    }

    res
      .status(200)
      .json({ success: true, message: "Students uploaded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process students CSV",
    });
  } finally {
    removeTempFile(req.file.path);
  }
};

export { uploadTeachers, uploadStudents };
