# myapp/urls.py
from django.urls import path
from .views import ClaimListViewSet, ClaimDetailsViewSet, NotesAndFlagsViewset
from rest_framework.routers import DefaultRouter

router = DefaultRouter()#these are the endpoints!
router.register(r'list', ClaimListViewSet, basename='list')
router.register(r'details', ClaimDetailsViewSet, basename='details')
router.register(r'notes-flags', NotesAndFlagsViewset, basename='notes-flags')
urlpatterns = router.urls
