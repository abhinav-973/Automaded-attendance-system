import base64
import importlib
import logging
import os

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
logger = logging.getLogger(__name__)


def _parse_allowed_origins():
    origins = os.getenv("FACE_SERVICE_CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
    return [origin.strip() for origin in origins.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_allowed_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def warmup_face_pipeline():
    try:
        handler = load_optional_model_function("warmup_model")
        handler()
        logger.info("Face recognition pipeline warmed up successfully.")
    except Exception:
        logger.exception("Face recognition pipeline warmup failed.")
        raise


class Student(BaseModel):
    name: str
    roll: str
    modelIdentity: str | None = None
    image: str | None = None


class RecognizeRequest(BaseModel):
    classroomImage: str
    students: list[Student]


class RecognizedStudent(BaseModel):
    name: str
    roll: str
    status: str


class RecognizeResponse(BaseModel):
    recognized: list[RecognizedStudent]
    totalPresent: int
    totalAbsent: int


def _strip_data_uri_prefix(image_string: str) -> str:
    if "," in image_string and image_string.split(",", 1)[0].startswith("data:image"):
        return image_string.split(",", 1)[1]
    return image_string


def decode_base64_image(image_string: str) -> np.ndarray:
    try:
        image_bytes = base64.b64decode(_strip_data_uri_prefix(image_string))
        image_buffer = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(image_buffer, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Decoded image is empty")
        return image
    except Exception as exc:
        raise ValueError("Invalid base64 image payload") from exc


def load_model_handler():
    module_name = os.getenv("FACE_MODEL_MODULE")
    function_name = os.getenv("FACE_MODEL_FUNCTION", "recognize_present_students")
    module_candidates = [module_name] if module_name else ["src.services.cv_adapter", "cv_adapter"]
    last_error = None

    for candidate in module_candidates:
        if not candidate:
            continue

        try:
            module = importlib.import_module(candidate)
        except ModuleNotFoundError as exc:
            last_error = exc
            continue

        handler = getattr(module, function_name, None)
        if handler is None:
            raise RuntimeError(
                f"Function '{function_name}' was not found in module '{candidate}'."
            )

        return handler

    raise RuntimeError(
        "CV adapter module could not be loaded. "
        "Set FACE_MODEL_MODULE or keep src.services.cv_adapter available."
    ) from last_error


def load_optional_model_function(function_name: str):
    module_name = os.getenv("FACE_MODEL_MODULE")
    module_candidates = [module_name] if module_name else ["src.services.cv_adapter", "cv_adapter"]
    last_error = None

    for candidate in module_candidates:
        if not candidate:
            continue

        try:
            module = importlib.import_module(candidate)
        except ModuleNotFoundError as exc:
            last_error = exc
            continue

        handler = getattr(module, function_name, None)
        if handler is not None:
            return handler

    raise RuntimeError(
        f"CV adapter function '{function_name}' could not be loaded."
    ) from last_error


def get_recognized_rolls(classroom_image_b64: str, students: list[Student]) -> set[str]:
    classroom_image = decode_base64_image(classroom_image_b64)
    student_payload = []

    for student in students:
        payload = {
            "name": student.name,
            "roll": student.roll,
            "modelIdentity": student.modelIdentity,
        }

        if student.image:
            payload["image_b64"] = student.image
            payload["image"] = decode_base64_image(student.image)

        student_payload.append(payload)

    handler = load_model_handler()
    recognized_rolls = handler(classroom_image=classroom_image, students=student_payload)

    if not isinstance(recognized_rolls, (set, list, tuple)):
        raise RuntimeError("CV adapter must return a list, tuple, or set of student rolls")

    valid_rolls = {student.roll for student in students}
    return {str(roll) for roll in recognized_rolls if str(roll) in valid_rolls}


@app.post("/recognize", response_model=RecognizeResponse)
async def recognize(data: RecognizeRequest):
    try:
        recognized_rolls = get_recognized_rolls(data.classroomImage, data.students)

        recognized = [
            RecognizedStudent(
                name=student.name,
                roll=student.roll,
                status="Present" if student.roll in recognized_rolls else "Absent",
            )
            for student in data.students
        ]

        present = [student for student in recognized if student.status == "Present"]
        absent = [student for student in recognized if student.status == "Absent"]

        return RecognizeResponse(
            recognized=recognized,
            totalPresent=len(present),
            totalAbsent=len(absent),
        )

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/identities")
async def identities():
    try:
        handler = load_optional_model_function("get_known_identities")
        known_identities = handler()
        return {"identities": known_identities, "total": len(known_identities)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
