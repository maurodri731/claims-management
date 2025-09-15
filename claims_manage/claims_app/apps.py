from django.apps import AppConfig


class ClaimsAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'claims_app'
    def ready(self):#this is how the signals start looking out for the creation of notes or flags
        import claims_app.signals