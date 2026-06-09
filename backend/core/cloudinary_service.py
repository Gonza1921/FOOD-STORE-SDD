"""Cloudinary service — image upload and deletion for product images

Architecture:
  ┌─────────────────────────────────────────────────────────────┐
  │ Router (HTTP multipart → bytes)                             │
  │   → cloudinary_service.upload_image(bytes) → URL string     │
  │   → cloudinary_service.delete_image(public_id) → None       │
  └─────────────────────────────────────────────────────────────┘

Usage:
    from backend.core.cloudinary_service import CloudinaryService

    svc = CloudinaryService()
    url = await svc.upload_image(file_bytes, public_id="producto_42")
    await svc.delete_image("producto_42")

All I/O is synchronous via cloudinary.uploader but wrapped in
run_in_executor to avoid blocking the async event loop.
"""

import asyncio
import logging
from typing import Optional
from urllib.parse import urlparse

import cloudinary
import cloudinary.uploader
import cloudinary.api

from backend.core.config import settings

logger = logging.getLogger(__name__)


class CloudinaryError(Exception):
    """Base exception for Cloudinary operations."""


class CloudinaryService:
    """Cloudinary image management service.

    Handles upload and deletion of product images.
    All network I/O runs off the event loop via run_in_executor.
    """

    def __init__(self) -> None:
        """Initialize Cloudinary with project settings."""
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True,
        )
        self._folder = "food-store/productos"

    # ------------------------------------------------------------------
    # Upload
    # ------------------------------------------------------------------

    async def upload_image(
        self,
        file_bytes: bytes,
        public_id: Optional[str] = None,
        *,
        overwrite: bool = True,
    ) -> str:
        """Upload an image to Cloudinary and return its URL.

        Args:
            file_bytes: Raw image bytes (from multipart upload).
            public_id: Optional public ID for the asset (e.g. ``producto_42``).
                       If omitted, Cloudinary generates a random one.
            overwrite: Whether to overwrite an existing asset with the same
                       public_id. Defaults to True.

        Returns:
            Secure URL of the uploaded image.

        Raises:
            CloudinaryError: If the upload fails for any reason.
        """
        try:
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: cloudinary.uploader.upload(
                    file_bytes,
                    public_id=public_id,
                    folder=self._folder,
                    overwrite=overwrite,
                    resource_type="image",
                    allowed_formats=["jpg", "jpeg", "png", "webp"],
                    transformation=[{"quality": "auto", "fetch_format": "auto"}],
                ),
            )
        except Exception as exc:
            logger.error("Cloudinary upload failed: %s", exc)
            raise CloudinaryError(f"Error al subir imagen: {exc}") from exc

        url: str = result.get("secure_url", "")
        if not url:
            raise CloudinaryError("Cloudinary no devolvió URL de la imagen")
        return url

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    async def delete_image(self, public_id: str) -> None:
        """Delete an image from Cloudinary by its public ID.

        The public_id can be the full public_id (with folder prefix) or just
        the basename. If it contains the folder prefix, it's used as-is;
        otherwise the folder is prepended.

        Args:
            public_id: Public ID of the image to delete.

        Raises:
            CloudinaryError: If the deletion fails (not-found is **not** an error).
        """
        # Normalise: ensure folder prefix
        full_id = (
            f"{self._folder}/{public_id}"
            if not public_id.startswith(self._folder)
            else public_id
        )

        try:
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: cloudinary.uploader.destroy(
                    full_id,
                    resource_type="image",
                ),
            )
        except Exception as exc:
            logger.error("Cloudinary delete failed for %s: %s", full_id, exc)
            raise CloudinaryError(f"Error al eliminar imagen: {exc}") from exc

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def extract_public_id(image_url: str) -> Optional[str]:
        """Extract the Cloudinary public ID from a secure URL.

        This is the inverse of ``upload_image``: given a URL returned
        by Cloudinary, extract the basename public ID (without folder).

        Returns ``None`` if the URL doesn't look like a Cloudinary URL.

        Example:
            >>> CloudinaryService.extract_public_id(
            ...     "https://res.cloudinary.com/demo/image/upload/..."
            ... )
            "producto_42"
        """
        parsed = urlparse(image_url)
        if "cloudinary" not in parsed.netloc:
            return None

        # Path looks like: /<cloud_name>/image/upload/v12345/<folder>/<public_id>.<ext>
        # or: /<cloud_name>/image/upload/<folder>/<public_id>.<ext>
        parts = parsed.path.split("/")
        # Find 'upload' in the path — the public_id starts after it
        try:
            upload_idx = parts.index("upload")
        except ValueError:
            return None

        # After 'upload', there may be a version prefix like 'v12345'
        after_upload = parts[upload_idx + 1:]
        if after_upload and after_upload[0].startswith("v") and after_upload[0][1:].isdigit():
            after_upload = after_upload[1:]

        # Join remaining parts and remove extension
        full = "/".join(after_upload)
        # Remove folder prefix and extension
        public_id_parts = full.rsplit(".", 1)[0].split("/")
        # Return the basename (last part after folder)
        return public_id_parts[-1] if public_id_parts else None

    @staticmethod
    def is_configured() -> bool:
        """Check if Cloudinary credentials are set in the environment.

        Returns:
            True if both cloud_name and api_key are non-empty.
        """
        return bool(
            settings.cloudinary_cloud_name and settings.cloudinary_api_key
        )
