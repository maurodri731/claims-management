from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from .models import ClaimList, ClaimDetails
from .serializers import ClaimListSerializer, ClaimDetailsSerializer

class ClaimListViewSet(ModelViewSet):
    queryset = ClaimList.objects.all()
    serializer_class = ClaimListSerializer

class ClaimDetailsViewSet(ModelViewSet):
    queryset = ClaimDetails.objects.all()
    serializer_class = ClaimDetailsSerializer