from django.contrib import admin
from .models import ChatRoom, RoomMember, Message, MessageStatus


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'room_type', 'created_by', 'created_at')
    list_filter = ('room_type', 'created_at')
    search_fields = ('name', 'created_by__username')
    readonly_fields = ('created_at',)


@admin.register(RoomMember)
class RoomMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'room', 'is_admin', 'joined_at')
    list_filter = ('is_admin', 'joined_at')
    search_fields = ('user__username', 'room__name')


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'room', 'msg_type', 'timestamp')
    list_filter = ('msg_type', 'timestamp')
    search_fields = ('sender__username', 'content', 'room__name')
    readonly_fields = ('timestamp',)


@admin.register(MessageStatus)
class MessageStatusAdmin(admin.ModelAdmin):
    list_display = ('user', 'message', 'is_read', 'read_at')
    list_filter = ('is_read', 'read_at')
    search_fields = ('user__username',)
