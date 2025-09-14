from rest_framework.viewsets import ModelViewSet
from .models import ClaimList, ClaimDetails, NotesAndFlags
from .serializers import ClaimListSerializer, ClaimDetailsSerializer, NotesAndFlagsSerializer
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Prefetch

class ClaimListViewSet(ModelViewSet):
    queryset = ClaimList.objects.all().prefetch_related('notes_and_flags')
    serializer_class = ClaimListSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {'id' : ['exact'], 
                        'patient_name' : ['exact', 'icontains'],
                        'status' : ['exact'],
                        'insurer_name' : ['exact'],
                        'billed_amount' : ['exact', 'gte', 'lte'],
                        'paid_amount' : ['exact', 'gte', 'lte'],
                        'discharge_date' : ['exact', 'gte', 'lte']}

class ClaimDetailsViewSet(ModelViewSet):
    #queryset = ClaimDetails.objects.all().prefetch_related('notes_and_flags')
    serializer_class = ClaimDetailsSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {'claim_id' : ['exact'],
                        'denial_reason' : ['exact'],
                        'denial_reason' : ['exact'],
                        'cpt_codes' : ['exact']}
    def get_queryset(self):
        nf_prefetch = Prefetch(
            'claim__notes_and_flags',
            queryset=NotesAndFlags.objects.all(),
            to_attr='prefetched_notes_flags'
        )
        return ClaimDetails.objects.select_related('claim').prefetch_related(nf_prefetch)
    
class NotesAndFlagsViewset(ModelViewSet):
    queryset = NotesAndFlags.objects.all()
    serializer_class = NotesAndFlagsSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {'claim_id' : ['exact'],
                       'note' : ['exact'],
                       'note_stamp' : ['exact'],
                       'flag' : ['exact'],
                       'flag_stamp' : ['exact']}