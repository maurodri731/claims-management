from django.db.models.signals import post_save, pre_save
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

@receiver(pre_save, sender=ClaimDetails)
def update_note_timestamp(sender, instance, **kwargs):
    #Only for existing objects
    if instance.pk:
        orig = sender.objects.get(pk=instance.pk)
        #Check if 'note' changed
        if orig.note != instance.note:
            if instance.note:  # note is not empty
                instance.note_stamp = timezone.now()
            else:  #note is empty
                instance.note_stamp = None
    else:
        #For new objects, in case the csv files are pre-loaded with their own notes field
        if instance.note:
            instance.note_stamp = timezone.now()
        else:
            instance.note_stamp = None
