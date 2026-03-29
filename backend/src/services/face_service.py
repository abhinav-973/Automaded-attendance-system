from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ────────────────────────────────────────────────────────────────────

class Student(BaseModel):
    name: str
    roll: str
    image: str              # base64 encoded face image of the student

class RecognizeRequest(BaseModel):
    classroomImage: str     # base64 image taken by teacher
    students: list[Student]

class RecognizedStudent(BaseModel):
    name: str
    roll: str
    status: str             # "Present" or "Absent"

class RecognizeResponse(BaseModel):
    recognized: list[RecognizedStudent]
    totalPresent: int
    totalAbsent: int

# ── Routes ────────────────────────────────────────────────────────────────────

@app.post("/recognize", response_model=RecognizeResponse)
async def recognize(data: RecognizeRequest):
    try:

        # ── YOUR FRIEND'S MODEL GOES HERE ──────────────────────────────
        # Input:
        #   data.classroomImage  → base64 image taken by teacher
        #   data.students        → list of students with name, roll, image
        #
        # Expected output:
        #   recognized_rolls     → a set/list of rolls who are present
        #   e.g: {"101", "102", "105"}
        # ──────────────────────────────────────────────────────────────

        recognized_rolls = set()  # ← replace this with your friend's model output

        # Build response
        recognized = [
            RecognizedStudent(
                name   = student.name,
                roll   = student.roll,
                status = "Present" if student.roll in recognized_rolls else "Absent"
            )
            for student in data.students
        ]

        present = [s for s in recognized if s.status == "Present"]
        absent  = [s for s in recognized if s.status == "Absent"]

        return RecognizeResponse(
            recognized   = recognized,
            totalPresent = len(present),
            totalAbsent  = len(absent),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return { "status": "ok" }