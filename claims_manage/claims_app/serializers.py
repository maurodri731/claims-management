from rest_framework import serializers
from .models import ClaimList, ClaimDetails

class ClaimListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClaimList
        fields = ['id', 'patient_name', 'billed_amount', 'paid_amount', 'status', 'insurer_name', 'discharge_date']

class ClaimDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClaimDetails
        fields = ['id', 'claim_id', 'denial_reason', 'cpt_codes']