from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import NotesAndFlags
'''this signal serves two purposes, updating the flag timestamp and the notetimestamp
whenever the client serves a PATCH request to update the flag or the note, 
this piece of code gets called so that the time for each is set
this avoids having to sync the time on the client and the server and makes the server the only source 
of truth. Since the PATCH sends a response back to the client, showing all of the updated fields, I leveraged
that to update the DOM with the correct value on the timestamp'''
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
