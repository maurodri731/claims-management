from rest_framework import serializers
from .models import ClaimList, ClaimDetails, NotesAndFlags

class ClaimListSerializer(serializers.ModelSerializer):
    flag = serializers.SerializerMethodField()

    class Meta:
        model = ClaimList
        fields = "__all__"  # <- for debugging
        extra_fields = ['flag']

    def get_flag(self, obj):
        return any(nf.flag for nf in obj.notes_and_flags.all())


class ClaimDetailsSerializer(serializers.ModelSerializer):
    nf_details = serializers.SerializerMethodField() #note and flag details
    class Meta:
        model = ClaimDetails
        fields = "__all__"
        read_only_fields = ['id', 'claim_id', 'denial_reason', 'cpt_codes']
    
    def get_nf_details(self, obj):
        notes_and_flags = getattr(obj.claim, 'prefetched_notes_flags', [])
        return [{'note_id' : nf.id, 'note' : nf.note, 'note_stamp' : nf.note_stamp, 'flag_stamp' : nf.flag_stamp}
                for nf in notes_and_flags]

class NotesAndFlagsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotesAndFlags
        fields = "__all__"