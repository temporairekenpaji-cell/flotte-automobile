from django.core.management.base import BaseCommand
from core.scheduler import check_and_create_notifications

class Command(BaseCommand):
    help = "Vérifie les dates d'expiration des documents administratifs des véhicules et génère les notifications."

    def handle(self, *args, **options):
        self.stdout.write("Début de la vérification des échéances des documents...")
        try:
            check_and_create_notifications()
            self.stdout.write(self.style.SUCCESS("Vérification terminée avec succès et notifications créées."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erreur lors de la vérification : {str(e)}"))
