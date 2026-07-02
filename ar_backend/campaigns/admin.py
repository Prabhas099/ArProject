from django.contrib import admin
from django.utils.html import format_html

from .models import Campaign


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "image_preview",
        "video_preview",
         "qr_preview",
        "target_index",
        "is_active",
        "created_at",
    )
    list_editable = (
        "is_active",
    )

    search_fields = (
        "title",
    )

    list_filter = (
        "is_active",
        "created_at",
    )

    readonly_fields = (
        "target_index",
        "created_at",
        "video_preview",
        "qr_preview",
    )

    actions = (
        "activate_campaigns",
        "deactivate_campaigns",
    )

    def image_preview(self, obj):
        if obj.target_image:
            return format_html(
                '<img src="{}" width="80" />',
                obj.target_image.url
            )
        return "-"

    image_preview.short_description = "Image"

    def video_preview(self, obj):
        if obj.video:
            return format_html(
                """
                <video width="150" controls>
                    <source src="{}" type="video/mp4">
                </video>
                """,
                obj.video.url
            )
        return "-"

    video_preview.short_description = "Video"

    def activate_campaigns(self, request, queryset):
        queryset.update(
            is_active=True
        )

        self.message_user(
            request,
            f"{queryset.count()} campaigns activated."
        )

    activate_campaigns.short_description = (
        "Activate selected campaigns"
    )

    def deactivate_campaigns(self, request, queryset):
        queryset.update(
            is_active=False
        )

        self.message_user(
            request,
            f"{queryset.count()} campaigns deactivated."
        )

    deactivate_campaigns.short_description = (
        "Deactivate selected campaigns"
    )

    def qr_preview(self, obj):
        if obj.qr_code:
            return format_html(
                '<img src="{}" width="150"/>',
                obj.qr_code.url
            )
        return "-"
    qr_preview.short_description = "QR Code"