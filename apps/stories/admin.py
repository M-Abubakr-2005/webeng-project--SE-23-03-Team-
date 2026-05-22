from django.contrib import admin
from .models import Story, StoryView


@admin.register(Story)
class StoryAdmin(admin.ModelAdmin):
    list_display = ('author', 'created_at', 'is_active', 'expires_at')
    list_filter = ('created_at', 'expires_at')
    search_fields = ('author__username', 'caption')
    readonly_fields = ('created_at', 'expires_at')


@admin.register(StoryView)
class StoryViewAdmin(admin.ModelAdmin):
    list_display = ('viewer', 'story', 'viewed_at')
    list_filter = ('viewed_at',)
    search_fields = ('viewer__username',)
