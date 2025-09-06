from rest_framework.viewsets import ModelViewSet
from .models import ClaimList, ClaimDetails
from .serializers import ClaimListSerializer, ClaimDetailsSerializer
from django_filters.rest_framework import DjangoFilterBackend

class ClaimListViewSet(ModelViewSet):
    queryset = ClaimList.objects.all()
    serializer_class = ClaimListSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['id', 'patient_name']

class ClaimDetailsViewSet(ModelViewSet):
    queryset = ClaimDetails.objects.all()
    serializer_class = ClaimDetailsSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['claim_id_id']