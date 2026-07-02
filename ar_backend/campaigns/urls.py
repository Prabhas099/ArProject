from django.urls import path
from .views import (
    CampaignListView,
    CampaignDetailView,
    ActiveCampaignView
)

urlpatterns = [
    path("", CampaignListView.as_view()),

    path(
        "active/",
        ActiveCampaignView.as_view()
    ),

    path(
        "<int:pk>/",
        CampaignDetailView.as_view()
    ),
]