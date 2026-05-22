from django.db import models
from django.contrib.auth.models import User


class ChatRoom(models.Model):
    ROOM_TYPES = [('direct', 'Direct'), ('group', 'Group')]

    name = models.CharField(max_length=128, blank=True, help_text="Empty for DMs, set for groups")
    room_type = models.CharField(max_length=10, choices=ROOM_TYPES, default='direct')
    avatar = models.ImageField(upload_to='rooms/', blank=True)
    members = models.ManyToManyField(User, through='RoomMember', related_name='chat_rooms')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_rooms')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name or f"DM - {self.created_at.date()}"

    def get_other_member(self, user):
        return self.members.exclude(id=user.id).first()

    def last_message(self):
        return self.messages.order_by('-timestamp').first()

    class Meta:
        ordering = ['-created_at']


class RoomMember(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='room_members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='room_memberships')
    nickname = models.CharField(max_length=64, blank=True)
    is_admin = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('room', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.room.name}"


class Message(models.Model):
    MSG_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('audio', 'Voice Message'),
        ('file', 'File'),
        ('system', 'System'),
    ]

    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sent_messages')
    msg_type = models.CharField(max_length=10, choices=MSG_TYPES, default='text')
    content = models.TextField(blank=True)
    file = models.FileField(upload_to='messages/', blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_edited = models.BooleanField(default=False)
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')

    def __str__(self):
        return f"{self.sender.username if self.sender else 'System'}: {self.content[:50]}"

    class Meta:
        ordering = ['timestamp']


class MessageStatus(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='statuses')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_statuses')
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('message', 'user')

    def __str__(self):
        return f"{self.user.username} - {self.message.id} - {'Read' if self.is_read else 'Unread'}"
