from rest_framework.viewsets import ModelViewSet
from .models import ClaimList, ClaimDetails, NotesAndFlags
from .serializers import ClaimListSerializer, ClaimDetailsSerializer, NotesAndFlagsSerializer
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Prefetch

class ClaimListViewSet(ModelViewSet):
    queryset = ClaimList.objects.all().prefetch_related('notes_and_flags')#used to append the flag status to the JSON response the client receives
    serializer_class = ClaimListSerializer
    filter_backends = [DjangoFilterBackend]#helps with the filtering of the values
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
    filter_backends = [DjangoFilterBackend]#filtering isn't realliy needed, but I plan to work on it in the future and I might need it then
    filterset_fields = {'claim_id' : ['exact'],
                        'denial_reason' : ['exact'],
                        'denial_reason' : ['exact'],
                        'cpt_codes' : ['exact']}
    def get_queryset(self):
        nf_prefetch = Prefetch(#prepare for the appending of the primary key, flag_stamp, note_stamp and note to the JSON response that goes to client
            'claim__notes_and_flags',#gather the NotesAndFlags records as they pertain to the ClaimList records, add them to a cache
            queryset=NotesAndFlags.objects.all(),#and the serializer will add them to the JSON respone
            to_attr='prefetched_notes_flags'#this can't be done directly (like it was for the ClaimList) because they are't aware of each other
        )#they technically share foreignkeys, but they aren't aware of this, but that connection can be leveraged to not have to go through n+1 queries
        return ClaimDetails.objects.select_related('claim').prefetch_related(nf_prefetch)
    
class NotesAndFlagsViewset(ModelViewSet):#this is only used when setting the flag and notes, the details get initially
    queryset = NotesAndFlags.objects.all()#rendered by the ClaimDetailsViewSet view
    serializer_class = NotesAndFlagsSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {'claim_id' : ['exact'],
                       'note' : ['exact'],
                       'note_stamp' : ['exact'],
                       'flag' : ['exact'],
                       'flag_stamp' : ['exact']}