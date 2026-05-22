from django.contrib import admin
from .models import UserProfile, FriendRequest, Friend

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_online', 'last_seen', 'theme')
    list_filter = ('is_online', 'theme', 'created_at')
    search_fields = ('user__username', 'user__email')


@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    list_display = ('from_user', 'to_user', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('from_user__username', 'to_user__username')


@admin.register(Friend)
class FriendAdmin(admin.ModelAdmin):
    list_display = ('user', 'friend', 'created_at')
    search_fields = ('user__username', 'friend__username')
