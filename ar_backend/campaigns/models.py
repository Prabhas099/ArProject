import os
import uuid
from .qr import generate_qr
from django.db import models
from django.core.exceptions import ValidationError


class Campaign(models.Model):

    title = models.CharField(max_length=255)

    target_index = models.IntegerField(
        unique=True,
        null=True,
        blank=True
    )

    target_image = models.ImageField(
        upload_to="targets/"
    )

    video = models.FileField(
        upload_to="videos/"
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    qr_code = models.ImageField(
        upload_to="qr_codes/",
        blank=True,
        null=True
    )

    campaign_id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True
    )

    ALLOWED_VIDEO_EXTENSIONS = [
        ".mp4",
        ".mov",
        ".webm",
    ]

    MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB

    def clean(self):
        if self.video:
            try:
                if self.video.size > self.MAX_VIDEO_SIZE_BYTES:
                    raise ValidationError(
                        "Video must be below 100 MB."
                    )
            except FileNotFoundError:
                pass

            ext = os.path.splitext(
                self.video.name
            )[1].lower()

            if ext not in self.ALLOWED_VIDEO_EXTENSIONS:
                raise ValidationError(
                    "Only MP4, MOV and WEBM videos are allowed."
                )

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        if not self.qr_code:
            generate_qr(self)
            super().save(update_fields=["qr_code"])

    def __str__(self):
        return self.title