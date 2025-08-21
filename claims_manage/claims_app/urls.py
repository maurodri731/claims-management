# myapp/urls.py
from django.urls import path
from .views import ClaimListViewSet, ClaimDetailsViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'list', ClaimListViewSet, basename='list')
router.register(r'details', ClaimDetailsViewSet, basename='details')
urlpatterns = router.urls
