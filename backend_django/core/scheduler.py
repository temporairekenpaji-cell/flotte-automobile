import time
import os
import logging
from datetime import date, timedelta
import threading

logger = logging.getLogger(__name__)

def check_and_create_notifications(document_id=None):
    """
    Checks administrative documents for expiration dates and updates their status.
    Generates notifications when nearing expiration or expired.
    If document_id is provided, only checks that specific document.
    """
    from django.db import connection
    db_tables = connection.introspection.table_names()
    if 'core_vehicledocument' not in db_tables:
        logger.info("Database tables not created yet. Skipping scheduled check.")
        return

    from core.models import VehicleDocument, Notification
    
    today = date.today()
    if document_id:
        documents = VehicleDocument.objects.filter(id=document_id)
    else:
        documents = VehicleDocument.objects.all()
        
    logger.info(f"Checking expirations for {documents.count()} documents on {today}...")
    
    for doc in documents:
        # Determine status dynamically
        diff_days = (doc.date_expiration - today).days
        
        old_status = doc.statut
        new_status = 'valide'
        
        if diff_days <= 0:
            new_status = 'expire'
        elif diff_days <= 30:
            new_status = 'expire_bientot'
        else:
            new_status = 'valide'
        
        if old_status != new_status:
            doc.statut = new_status
            doc.save(update_fields=['statut'])
            logger.info(f"Updated status of document {doc.id} from {old_status} to {new_status}")
            
        # Manage notifications based on the current status
        if new_status == 'valide':
            # Clôturer toutes les notifications actives liées à ce document
            closed_count = Notification.objects.filter(document=doc, is_closed=False).update(is_closed=True)
            if closed_count > 0:
                logger.info(f"Closed {closed_count} notifications for valid document {doc.id}")
            continue

        should_notify = False
        message = ""
        doc_type_name = doc.get_document_type_display()
        
        # Determine targeting strings
        if doc.vehicle:
            target_str = f"du véhicule {doc.vehicle.immatriculation}"
        elif doc.chauffeur:
            target_str = f"du chauffeur {doc.chauffeur.nom}"
        else:
            target_str = "concerné"

        if new_status == 'expire':
            should_notify = True
            message = f"ATTENTION : Le document {doc_type_name} {target_str} est expiré. Le renouvellement est obligatoire."
        elif new_status == 'expire_bientot':
            if diff_days == 1:
                should_notify = True
                message = f"URGENT : Le document {doc_type_name} {target_str} expire demain. Veuillez procéder à son renouvellement."
            elif diff_days <= 3:
                should_notify = True
                message = f"Le document {doc_type_name} {target_str} expirera dans 3 jours. Veuillez prévoir son renouvellement."
            elif diff_days <= 7:
                should_notify = True
                message = f"Le document {doc_type_name} {target_str} expirera dans 7 jours. Veuillez prévoir son renouvellement."
            elif diff_days <= 14:
                should_notify = True
                message = f"Le document {doc_type_name} {target_str} expirera dans 2 semaines. Veuillez prévoir son renouvellement."
            elif diff_days <= 30:
                should_notify = True
                message = f"Le document {doc_type_name} {target_str} expirera dans 1 mois. Veuillez prévoir son renouvellement."
            
        if should_notify:
            # Clôturer les anciennes notifications obsolètes (ex: passer de bientot_expire à expire)
            Notification.objects.filter(document=doc, is_closed=False).exclude(message=message).update(is_closed=True)
            
            # Prevent duplicate active notifications for this message
            already_notified = Notification.objects.filter(
                document=doc,
                message=message,
                is_closed=False
            ).exists()
            
            if not already_notified:
                Notification.objects.create(
                    vehicle=doc.vehicle,
                    chauffeur=doc.chauffeur,
                    document=doc,
                    message=message,
                    is_read=False,
                    is_closed=False
                )
                logger.info(f"Created expiration notification for document {doc.id} (status: {new_status})")

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
