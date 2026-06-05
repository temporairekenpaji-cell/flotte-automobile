import os

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

DEFAULT_EMAIL = 'societeatl2@gmail.com'
DEFAULT_USERNAME = 'admin'
DEFAULT_PASSWORD = 'admin123'


class Command(BaseCommand):
    help = "Crée ou met à jour le compte administrateur unique."

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Met à jour email et mot de passe du compte admin existant.',
        )

    def handle(self, *args, **options):
        email = os.getenv('ADMIN_EMAIL', DEFAULT_EMAIL)
        username = os.getenv('ADMIN_USERNAME', DEFAULT_USERNAME)
        password = os.getenv('ADMIN_PASSWORD', DEFAULT_PASSWORD)

        # Check if any administrator exists (either by role or superuser status)
        admin_exists = User.objects.filter(role='admin').exists() or User.objects.filter(is_superuser=True).exists()

        if admin_exists:
            if options['reset']:
                user = User.objects.filter(role='admin').first() or User.objects.filter(is_superuser=True).first()
                user.email = email
                user.username = username
                user.role = 'admin'
                user.is_staff = True
                user.is_superuser = True
                user.set_password(password)
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Administrateur réinitialisé : {user.email}'))
            else:
                self.stdout.write(self.style.WARNING('Compte admin déjà présent — aucun changement.'))
            return

        # No administrator exists, create one
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role='admin',
            is_staff=True,
            is_superuser=True,
        )
        self.stdout.write(self.style.SUCCESS(f'Administrateur créé : {user.email}'))
