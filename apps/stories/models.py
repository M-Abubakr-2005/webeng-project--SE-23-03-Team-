from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta


class Story(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stories')
    media = models.FileField(upload_to='stories/')
    caption = models.CharField(max_length=256, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"{self.author.username}'s Story"

    def is_active(self):
        return timezone.now() < self.expires_at

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']


class StoryView(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='views')
    viewer = models.ForeignKey(User, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('story', 'viewer')

    def __str__(self):
        return f"{self.viewer.username} viewed {self.story.author.username}'s story"
