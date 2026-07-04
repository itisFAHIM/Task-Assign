from rest_framework import serializers
from .models import Image, Polygon

class PolygonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Polygon
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

class ImageSerializer(serializers.ModelSerializer):
    polygons = PolygonSerializer(many=True, read_only=True)

    class Meta:
        model = Image
        fields = '__all__'
        read_only_fields = ('user', 'uploaded_at')
