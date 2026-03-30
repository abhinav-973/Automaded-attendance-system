import "dotenv/config";
import mongoose from "mongoose";
import Class from "../src/models/class.model.js";

const normalizeSection = (value) => String(value || "").trim().toUpperCase();

const humanizeIdentity = (value) =>
  String(value || "")
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const buildPlaceholderEmail = (identity, roll, section) => {
  const slug = String(identity || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || `student-${roll}`}-${String(section).toLowerCase()}@students.local`;
};

const main = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });

  const db = mongoose.connection.db;
  const studentsCollection = db.collection("students");
  const classesCollection = db.collection("classes");

  const classes = await Class.find({}, { name: 1, teacherId: 1 }).lean();
  const classesByName = new Map(
    classes.map((classDoc) => [normalizeSection(classDoc.name), classDoc])
  );

  const rawStudents = await studentsCollection
    .find({
      section: { $exists: true },
      classId: { $exists: false },
    })
    .toArray();

  const migrated = [];
  const skipped = [];

  for (const student of rawStudents) {
    const section = normalizeSection(student.section);
    const classDoc = classesByName.get(section);

    if (!classDoc) {
      skipped.push({
        id: String(student._id),
        section,
        name: student.name,
        reason: "missing_class",
      });
      continue;
    }

    const modelIdentity = humanizeIdentity(student.name);
    const email = student.email || buildPlaceholderEmail(student.name, student.roll, section);

    await studentsCollection.updateOne(
      { _id: student._id },
      {
        $set: {
          name: modelIdentity,
          roll: String(student.roll),
          email,
          classId: classDoc._id,
          modelIdentity,
          faceImage: student.faceImage || null,
          updatedAt: student.updatedAt || new Date(),
          createdAt: student.createdAt || new Date(),
        },
        $unset: {
          section: "",
        },
      }
    );

    migrated.push({
      id: String(student._id),
      section,
      className: classDoc.name,
      name: modelIdentity,
      roll: String(student.roll),
    });
  }

  for (const classDoc of classes) {
    const totalStudents = await studentsCollection.countDocuments({
      classId: classDoc._id,
    });

    await classesCollection.updateOne(
      { _id: classDoc._id },
      {
        $set: { totalStudents },
      }
    );
  }

  const totals = await classesCollection
    .find({}, { projection: { name: 1, totalStudents: 1 } })
    .sort({ name: 1 })
    .toArray();

  console.log(
    JSON.stringify(
      {
        rawStudentsFound: rawStudents.length,
        migratedCount: migrated.length,
        skippedCount: skipped.length,
        skipped,
        totals,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
