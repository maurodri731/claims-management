from django.apps import AppConfig


class ClaimsAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'claims_app'
    def ready(self):
        import claims_app.signals