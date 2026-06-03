import time
import os
import logging
from datetime import date, timedelta
import threading

logger = logging.getLogger(__name__)

def check_and_create_notifications():
    """
    Checks all active vehicle documents for expiration dates and updates their status.
    Generates single notifications per document expiration date to prevent duplicates.
    """
    from django.db import connection
    db_tables = connection.introspection.table_names()
    if 'core_vehicledocument' not in db_tables:
        logger.info("Database tables 'core_vehicledocument' not created yet. Skipping scheduled check.")
        return

    from core.models import VehicleDocument, Notification
    
    today = date.today()
    documents = VehicleDocument.objects.all()
    
    logger.info(f"Checking expirations for {documents.count()} documents on {today}...")
    
    for doc in documents:
        # Determine status dynamically
        diff_days = (doc.date_expiration - today).days
        
        old_status = doc.statut
        new_status = 'valide'
        
        if diff_days <= 0:
            new_status = 'expire'
        else:
            # Check period rules
            if doc.periode in ['1_an', '6_mois']:
                if diff_days <= 30:
                    new_status = 'expire_bientot'
            elif doc.periode == '3_mois':
                if diff_days <= 7:
                    new_status = 'expire_bientot'
        
        if old_status != new_status:
            doc.statut = new_status
            doc.save(update_fields=['statut'])
            logger.info(f"Updated status of {doc} from {old_status} to {new_status}")
            
        # Determine if notification should be sent
        should_notify = False
        msg_template = ""
        
        doc_type_name = doc.get_document_type_display()
        vehicle_plate = doc.vehicle.immatriculation
        
        if new_status == 'expire_bientot':
            should_notify = True
            msg_template = f"L'échéance du document '{doc_type_name}' pour le véhicule {vehicle_plate} approche. Date d'expiration : {doc.date_expiration}. Merci de procéder au renouvellement."
        elif new_status == 'expire':
            should_notify = True
            msg_template = f"Le document '{doc_type_name}' pour le véhicule {vehicle_plate} a expiré le {doc.date_expiration}. Merci de procéder au renouvellement immédiat."
            
        if should_notify:
            # Prevent duplicate notifications for this specific expiration date
            # We search for any notification containing the document ID and the expiration date in the message
            notif_identifier = f"({doc.date_expiration})"
            already_notified = Notification.objects.filter(
                document=doc,
                message__contains=notif_identifier
            ).exists()
            
            if not already_notified:
                message = f"{msg_template} ({doc.date_expiration})"
                Notification.objects.create(
                    vehicle=doc.vehicle,
                    document=doc,
                    message=message,
                    is_read=False
                )
                logger.info(f"Created expiration notification for document {doc.id} (expiration: {doc.date_expiration})")

def scheduler_loop():
    # Wait for the DB/App to start up properly
    time.sleep(10)
    while True:
        try:
            check_and_create_notifications()
        except Exception as e:
            logger.error(f"Error during scheduled expiration checks: {e}", exc_info=True)
        # Run once every 24 hours (86400 seconds)
        time.sleep(86400)

def start_scheduler():
    # Check environment variable to allow disabling the background thread in production/tests
    if os.environ.get('ENABLE_BACKGROUND_SCHEDULER', 'True') == 'True':
        logger.info("Starting background scheduler for document expirations...")
        thread = threading.Thread(target=scheduler_loop, daemon=True, name="DocExpirationScheduler")
        thread.start()
    else:
        logger.info("Background scheduler is disabled via ENABLE_BACKGROUND_SCHEDULER environment variable.")
