import csv
from django.core.management.base import BaseCommand
from django.db import transaction
from claims_app.models import ClaimDetails, ClaimList

'''
Load the data files for the database. The List has to go first because it contains the foreign key the Details rely on
'''
class Command(BaseCommand):
    help = "Load ClaimDetails first, then ClaimList from CSV files"

    def add_arguments(self, parser):
        parser.add_argument(
            '--append',
            action='store_true',
            help='Append data instead of clearing existing records'
        )

    def handle(self, *args, **options):
        details_file = "data\\claim_detail_data.csv"
        list_file = "data\\claim_list_data.csv"

        fk_fields = {
            f.name: f for f in ClaimDetails._meta.get_fields()
            if f.get_internal_type() == "ForeignKey"
        }

        try:
            with transaction.atomic():
                if not options['append']:
                    self.stdout.write("Clearing existing data...")
                    ClaimList.objects.all().delete()
                    ClaimDetails.objects.all().delete()

                # --- Load ClaimDetails ---
                with open(details_file, newline="") as f:
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

                self.stdout.write(self.style.SUCCESS("Loaded ClaimDetails data"))

                # --- Load ClaimList ---
                with open(list_file, newline="") as f:
                    reader = csv.DictReader(f, delimiter='|')
                    for row in reader:
                        ClaimList.objects.create(**row)

                self.stdout.write(self.style.SUCCESS("Loaded ClaimList data"))

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error loading data: {e}"))
