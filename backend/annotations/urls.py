from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ImageViewSet, PolygonViewSet

router = DefaultRouter()
router.register(r'images', ImageViewSet, basename='image')
router.register(r'polygons', PolygonViewSet, basename='polygon')

urlpatterns = [
    path('', include(router.urls)),
]
