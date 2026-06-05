from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        import core.signals  # Register signals
        import os
        # Only run in the main process, not the reloader process
        if os.environ.get('RUN_MAIN') == 'true' or not os.environ.get('RUN_MAIN'):
            from .scheduler import start_scheduler
            start_scheduler()
            
            # Auto-run ensure_admin to create the administrator upon startup if needed
            try:
                from django.core.management import call_command
                call_command('ensure_admin')
            except Exception as e:
                # Fails silently if database is not migrated yet
                print(f"Optionnel : L'administrateur n'a pas pu être créé automatiquement (base non migrée ou indisponible) : {e}")
