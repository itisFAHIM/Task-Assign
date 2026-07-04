from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Image(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='images')
    file = models.ImageField(upload_to='annotations/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image {self.id} by {self.user.email}"

class Polygon(models.Model):
    LABEL_CHOICES = [
        ('Tumor',      'Tumor'),
        ('Lesion',     'Lesion'),
        ('Organ',      'Organ'),
        ('Background', 'Background'),
    ]
    image = models.ForeignKey(Image, on_delete=models.CASCADE, related_name='polygons')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='polygons')
    # points stored as JSON: [{"x": 10, "y": 20}, ...]
    points = models.JSONField(default=list)
    label = models.CharField(max_length=50, choices=LABEL_CHOICES, default='Background')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Polygon {self.id} ({self.label}) on Image {self.image.id}"
