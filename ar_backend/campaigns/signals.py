from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Campaign

from .services.target_generator import (
    generate_targets
)

@receiver(post_save, sender=Campaign)
def campaign_saved(
    sender,
    instance,
    **kwargs
):

    generate_targets()