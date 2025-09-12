from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import ClaimList, ClaimDetails

@receiver(post_save, sender=ClaimList)
def update_flag_timestamp(sender, instance, **kwargs):
    details, _ = ClaimDetails.objects.get_or_create(claim_id=instance)
    if instance.flag:
        details.flag_stamp = timezone.now()
    else:
        details.flag_stamp = None
    details.save()
