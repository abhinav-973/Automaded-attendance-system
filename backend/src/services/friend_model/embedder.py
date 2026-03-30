"""
ArcFace embedder for aligned 112x112 face crops.
"""

import logging
import os
import shutil
import urllib.request
import zipfile
from pathlib import Path
from typing import List, Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

BUFFALO_L_REC_FILENAME = "w600k_r50.onnx"
DEFAULT_MODEL_ARCHIVE_URLS = (
    "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip",
    "https://storage.insightface.ai/files/models/buffalo_l.zip",
)


class FaceEmbedder:
    """
    Load the ArcFace recognition model directly and return normalized embeddings.
    """

    def __init__(self, model_name: str = "buffalo_l"):
        self.model_name = model_name
        self._rec_model = None
        self._load()

    def _load(self):
        try:
            from insightface.model_zoo import model_zoo

            model_root = Path(
                os.getenv(
                    "FACE_EMBEDDER_DIR",
                    Path(__file__).resolve().parents[3] / "models" / "insightface" / self.model_name,
                )
            )
            models_root = str(model_root)
            rec_path = os.path.join(models_root, BUFFALO_L_REC_FILENAME)

            if not os.path.exists(rec_path):
                self._download_model_pack(models_root)

            if not os.path.exists(rec_path):
                raise FileNotFoundError(
                    f"Recognition model missing: {rec_path}. "
                    "Ensure the machine has internet access for the first run."
                )

            self._rec_model = model_zoo.get_model(
                rec_path,
                providers=["CPUExecutionProvider"],
            )
            self._rec_model.prepare(ctx_id=0)
            logger.info("[Embedder] ArcFace loaded: %s", rec_path)

        except ImportError as exc:
            raise ImportError(
                "InsightFace is not installed. Run: pip install insightface onnxruntime"
            ) from exc
        except Exception as exc:
            raise RuntimeError(
                f"[Embedder] Failed to load model: {exc}. "
                "If this is the first run, make sure the machine has internet access "
                "so InsightFace can download the buffalo_l recognition model."
            ) from exc

    def _download_model_pack(self, models_root: str):
        os.makedirs(models_root, exist_ok=True)
        archive_path = os.path.join(os.path.dirname(models_root), f"{self.model_name}.zip")
        custom_url = os.getenv("FACE_EMBEDDER_ZIP_URL")
        archive_urls = [url for url in (custom_url, *DEFAULT_MODEL_ARCHIVE_URLS) if url]
        last_error = None

        for url in archive_urls:
            try:
                logger.info("[Embedder] Downloading model pack from %s", url)
                urllib.request.urlretrieve(url, archive_path)
                with zipfile.ZipFile(archive_path, "r") as archive:
                    archive.extractall(models_root)
                logger.info("[Embedder] Model pack extracted to %s", models_root)
                return
            except Exception as exc:
                last_error = exc
                logger.warning("[Embedder] Failed to download from %s: %s", url, exc)
            finally:
                if os.path.exists(archive_path):
                    try:
                        os.remove(archive_path)
                    except OSError:
                        pass

        shutil.rmtree(models_root, ignore_errors=True)
        raise RuntimeError(
            f"Unable to download {self.model_name}.zip from the configured sources."
        ) from last_error

    def embed(self, aligned_face: np.ndarray) -> Optional[np.ndarray]:
        if aligned_face is None:
            return None

        if aligned_face.shape[:2] != (112, 112):
            aligned_face = cv2.resize(aligned_face, (112, 112))

        try:
            embedding = self._rec_model.get_feat(aligned_face.astype(np.float32))
            if embedding is None:
                return None

            vector = embedding.flatten().astype(np.float32)
            norm = np.linalg.norm(vector)
            if norm < 1e-6:
                logger.warning("[Embedder] Near-zero norm, skipping face.")
                return None

            return vector / norm
        except Exception as exc:
            logger.error("[Embedder] embed() failed: %s", exc)
            return None

    def embed_with_augmentation(self, aligned_face: np.ndarray) -> List[np.ndarray]:
        if aligned_face is None:
            return []

        height, width = aligned_face.shape[:2]

        def downscale(face: np.ndarray, scale: float) -> np.ndarray:
            resized = cv2.resize(
                face,
                (int(width * scale), int(height * scale)),
                interpolation=cv2.INTER_AREA,
            )
            return cv2.resize(resized, (width, height), interpolation=cv2.INTER_CUBIC)

        variations = [
            aligned_face,
            cv2.flip(aligned_face, 1),
            self._adjust_brightness(aligned_face, 1.2),
            self._adjust_brightness(aligned_face, 0.8),
            self._adjust_contrast(aligned_face, 1.15),
            downscale(aligned_face, 0.50),
            downscale(aligned_face, 0.35),
            cv2.GaussianBlur(aligned_face, (3, 3), 0),
            self._adjust_brightness(cv2.flip(aligned_face, 1), 0.85),
        ]

        embeddings = []
        for face in variations:
            embedding = self.embed(face)
            if embedding is not None:
                embeddings.append(embedding)

        return embeddings

    def embed_batch(
        self,
        faces: List[np.ndarray],
        augment: bool = False,
    ) -> List[Optional[np.ndarray]]:
        if augment:
            embeddings = []
            for face in faces:
                embeddings.extend(self.embed_with_augmentation(face))
            return embeddings

        return [self.embed(face) for face in faces]

    @staticmethod
    def _adjust_brightness(image: np.ndarray, factor: float) -> np.ndarray:
        return np.clip(image.astype(np.float32) * factor, 0, 255).astype(np.uint8)

    @staticmethod
    def _adjust_contrast(image: np.ndarray, factor: float) -> np.ndarray:
        mean = np.mean(image)
        return np.clip(
            mean + factor * (image.astype(np.float32) - mean),
            0,
            255,
        ).astype(np.uint8)
