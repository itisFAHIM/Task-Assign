from rest_framework import viewsets
from .models import Task
from .serializers import TaskSerializer
from rest_framework.permissions import IsAuthenticated

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.filter(user=self.request.user)
        date_filter = self.request.query_params.get('date', None)
        if date_filter:
            queryset = queryset.filter(due_date=date_filter)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
