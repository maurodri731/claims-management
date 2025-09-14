from django.db import models

# Create your models here.
class ClaimList(models.Model):
    patient_name = models.CharField(max_length=200)
    billed_amount = models.DecimalField(max_digits=15, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20)
    insurer_name = models.CharField(max_length=50)
    discharge_date = models.DateField()

    def __str__(self):
        return f"{self.patient_name} - {self.billed_amount} - {self.paid_amount} - {self.status} - {self.insurer_name} on {self.discharge_date}"
    
class ClaimDetails(models.Model):
    claim = models.ForeignKey(ClaimList, on_delete=models.CASCADE, related_name="claims")
    denial_reason = models.CharField(max_length=200, null=True)
    cpt_codes= models.CharField(max_length=200)

    def __str__(self):
        return f"{self.claim_id} - {self.denial_reason} - {self.cpt_codes}"
    
class NotesAndFlags(models.Model):
    claim = models.ForeignKey(ClaimList, on_delete=models.CASCADE, related_name="notes_and_flags")
    flag = models.BooleanField(default=False)
    note = models.TextField(default="",blank=True)
    note_stamp = models.DateTimeField(null=True, blank=True)
    flag_stamp = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.note} - {self.note_stamp} - {self.flag} - {self.flag_stamp}"