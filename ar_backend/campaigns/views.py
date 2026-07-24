from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics
from .models import Campaign
from .serializers import CampaignSerializer


class CampaignListView(generics.ListCreateAPIView):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer


class CampaignDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer


class ActiveCampaignView(APIView):
    def get(self, request):
        campaign = Campaign.objects.filter(
            is_active=True
        ).first()

        serializer = CampaignSerializer(
            campaign
        )

        return Response(serializer.data)


from django.views.generic import RedirectView

class QRRedirectView(RedirectView):
    permanent = False

    def get_redirect_url(self, *args, **kwargs):
        host = self.request.get_host().split(':')[0]
        return f"http://{host}:5173/"