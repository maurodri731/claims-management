import csv
from django.core.management.base import BaseCommand
from claims_app.models import ClaimDetails  # change this to your model

class Command(BaseCommand):
    help = "Load data from a CSV file into the model"

    def handle(self, *args, **kwargs):
        csv_file = "data\\claim_detail_data.csv"
        
        fk_fields = {
            f.name: f for f in ClaimDetails._meta.get_fields()
            if f.get_internal_type() == "ForeignKey"
        }
        
        with open(csv_file, newline="") as f:
            reader = csv.DictReader(f, delimiter='|')
            for row in reader:
                clean_row = {}

                for field, value in row.items():
                    field = field.strip()
                    if field in fk_fields:
                        clean_row[f"{field}_id"] = int(value) if value.isdigit() else value
                    else:
                        clean_row[field] = value

                ClaimDetails.objects.create(**clean_row)
        
        self.stdout.write(self.style.SUCCESS(f"Loaded data from provided files"))