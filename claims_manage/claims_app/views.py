from rest_framework.viewsets import ModelViewSet
from .models import ClaimList, ClaimDetails
from .serializers import ClaimListSerializer, ClaimDetailsSerializer
from django_filters.rest_framework import DjangoFilterBackend

class ClaimListViewSet(ModelViewSet):
    queryset = ClaimList.objects.all()
    serializer_class = ClaimListSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {'id' : ['exact'], 
                        'patient_name' : ['exact', 'icontains'],
                        'status' : ['exact'],
                        'insurer_name' : ['exact'],
                        'billed_amount' : ['exact', 'gte', 'lte'],
                        'paid_amount' : ['exact', 'gte', 'lte'],
                        'discharge_date' : ['exact', 'gte', 'lte'],
                        'flag' : ['exact']}

class ClaimDetailsViewSet(ModelViewSet):
    queryset = ClaimDetails.objects.all()
    serializer_class = ClaimDetailsSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {'claim_id' : ['exact'],
                        'denial_reason' : ['exact'],
                        'denial_reason' : ['exact'],
                        'cpt_codes' : ['exact'],
                        'flag_stamp' : ['exact']}