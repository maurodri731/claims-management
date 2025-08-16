import csv
from django.core.management.base import BaseCommand
from claims_app.models import ClaimList  # change this to your model

class Command(BaseCommand):
    help = "Load data from a CSV file into the model"

    def handle(self, *args, **kwargs):
        csv_file = "data\\claim_list_data.csv"

        with open(csv_file, newline="") as f:
            reader = csv.DictReader(f, delimiter='|')
            for row in reader:
                ClaimList.objects.create(**row)

        self.stdout.write(self.style.SUCCESS(f"Loaded data from provided files"))
