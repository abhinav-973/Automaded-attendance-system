import logging
import os
import re
from pathlib import Path
from threading import Lock

logger = logging.getLogger(__name__)

_PIPELINE = None
_PIPELINE_LOCK = Lock()


try:
    from .friend_model.aligner import FaceAligner
    from .friend_model.classifier import EnsembleClassifier
    from .friend_model.detector import YOLOFaceDetector
    from .friend_model.embedder import FaceEmbedder
except ImportError:
    if __package__:
        raise

    from friend_model.aligner import FaceAligner
    from friend_model.classifier import EnsembleClassifier
    from friend_model.detector import YOLOFaceDetector
    from friend_model.embedder import FaceEmbedder


def _backend_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _normalize_name(value: str) -> str:
    return re.sub(r"[^A-Z0-9]+", "", value.upper())


def _build_roster_index(students):
    name_to_roll = {}
    ambiguous_names = set()

    for student in students:
        identity_name = student.get("modelIdentity") or student["name"]
        normalized_name = _normalize_name(identity_name)
        if not normalized_name:
            continue

        if normalized_name in name_to_roll and name_to_roll[normalized_name] != student["roll"]:
            ambiguous_names.add(normalized_name)
            continue

        name_to_roll[normalized_name] = str(student["roll"])

    for ambiguous_name in ambiguous_names:
        name_to_roll.pop(ambiguous_name, None)

    if ambiguous_names:
        logger.warning(
            "Skipping ambiguous roster names for direct recognition: %s",
            ", ".join(sorted(ambiguous_names)),
        )

    return name_to_roll


class FriendModelPipeline:
    def __init__(self):
        models_dir = _backend_root() / "models"
        detector_path = Path(
            os.getenv("FACE_DETECTOR_WEIGHTS_PATH", models_dir / "yolov8n-face.pt")
        )
        classifier_path = Path(
            os.getenv("FACE_CLASSIFIER_PATH", models_dir / "classifier.pkl")
        )

        if not detector_path.exists():
            raise FileNotFoundError(f"Face detector weights not found: {detector_path}")
        if not classifier_path.exists():
            raise FileNotFoundError(f"Face classifier not found: {classifier_path}")

        try:
            self.detector = YOLOFaceDetector(str(detector_path))
            self.aligner = FaceAligner()
            self.embedder = FaceEmbedder(
                model_name=os.getenv("FACE_EMBEDDER_MODEL", "buffalo_l")
            )
            self.classifier = EnsembleClassifier.load(str(classifier_path))
        except ModuleNotFoundError as exc:
            raise RuntimeError(
                "Friend model dependencies are missing. Install backend/requirements.txt "
                "and restart the face service."
            ) from exc

        logger.info(
            "Friend model pipeline loaded with detector=%s classifier=%s",
            detector_path,
            classifier_path,
        )
        self.known_names = {
            _normalize_name(name)
            for name in self.classifier._label_to_name.values()
        }

    def _validate_roster_against_model(self, roster_by_name):
        overlapping_names = [
            normalized_name
            for normalized_name in roster_by_name
            if normalized_name in self.known_names
        ]

        if not overlapping_names:
            raise ValueError(
                "The selected class roster does not match the trained model identities. "
                "No student names from this class were found in the imported classifier."
            )

        if len(overlapping_names) < len(roster_by_name):
            logger.warning(
                "Only %s of %s roster names match the imported classifier.",
                len(overlapping_names),
                len(roster_by_name),
            )

    def recognize_present_students(self, classroom_image, students):
        roster_by_name = _build_roster_index(students)
        if not roster_by_name:
            logger.warning("No class roster names were eligible for direct recognition.")
            return set()
        self._validate_roster_against_model(roster_by_name)

        detections = self.detector.detect(classroom_image)
        if not detections:
            return set()

        aligned_faces = self.aligner.align_batch(classroom_image, detections)
        recognized_rolls = set()

        for aligned_face in aligned_faces:
            if aligned_face is None:
                continue

            embedding = self.embedder.embed(aligned_face)
            if embedding is None:
                continue

            result = self.classifier.predict(embedding)
            if not result.is_known:
                continue

            predicted_name = _normalize_name(result.name)
            matched_roll = roster_by_name.get(predicted_name)
            if matched_roll:
                recognized_rolls.add(matched_roll)
            else:
                logger.info(
                    "Predicted '%s' but no matching student was found in the selected class roster.",
                    result.name,
                )

        return recognized_rolls


def _get_pipeline():
    global _PIPELINE

    if _PIPELINE is not None:
        return _PIPELINE

    with _PIPELINE_LOCK:
        if _PIPELINE is None:
            _PIPELINE = FriendModelPipeline()

    return _PIPELINE


def recognize_present_students(classroom_image, students):
    return _get_pipeline().recognize_present_students(classroom_image, students)


def get_known_identities():
    pipeline = _get_pipeline()
    return sorted(pipeline.classifier._label_to_name.values(), key=str.casefold)


def warmup_model():
    _get_pipeline()
