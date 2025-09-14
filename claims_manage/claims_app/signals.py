from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import NotesAndFlags

@receiver(pre_save, sender=NotesAndFlags)
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

        if not orig.flag and instance.flag:
            instance.flag_stamp = timezone.now()
        
        elif orig.flag and not instance.flag:
            instance.flag_stamp = None
        
    else:
        #For new objects, in case the csv files are pre-loaded with their own notes field
        if instance.note:
            instance.note_stamp = timezone.now()
        else:
            instance.note_stamp = None

        if instance.flag:
            instance.flag_stamp = timezone.now()
        else:
            instance.flag_stamp = None
