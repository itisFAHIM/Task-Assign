from rest_framework import viewsets, parsers
from .models import Image, Polygon
from .serializers import ImageSerializer, PolygonSerializer
from rest_framework.permissions import IsAuthenticated

class ImageViewSet(viewsets.ModelViewSet):
    serializer_class = ImageSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (parsers.MultiPartParser, parsers.FormParser)

    def get_queryset(self):
        return Image.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PolygonViewSet(viewsets.ModelViewSet):
    serializer_class = PolygonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Polygon.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
