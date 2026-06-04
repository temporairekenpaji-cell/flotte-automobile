from django.db.models.signals import post_save
from django.dispatch import receiver
from core.models import VehicleDocument
from core.scheduler import check_and_create_notifications

@receiver(post_save, sender=VehicleDocument)
def handle_document_saved(sender, instance, created, **kwargs):
    """
    Triggers checking and notification creation immediately upon creation or edit
    of a VehicleDocument.
    """
    # Prevent infinite recursion since check_and_create_notifications saves doc.statut
    # We disconnect and reconnect the signal if needed, or pass a flag, or simply check if the update is only statut
    # Actually, we can disconnect the signal temporarily to prevent recursion.
    post_save.disconnect(handle_document_saved, sender=VehicleDocument)
    try:
        check_and_create_notifications(document_id=instance.id)
    finally:
        post_save.connect(handle_document_saved, sender=VehicleDocument)
