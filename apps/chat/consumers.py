import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.utils import timezone
from .models import ChatRoom, Message, MessageStatus


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'room_{self.room_id}'
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self.set_user_online(True)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_update',
                'user_id': self.user.id,
                'username': self.user.username,
                'is_online': True,
            }
        )

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            await self.set_user_online(False)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'presence_update',
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'is_online': False,
                }
            )

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get('type')

        if msg_type == 'chat_message':
            await self.handle_chat_message(data)
        elif msg_type == 'typing':
            await self.handle_typing(data)
        elif msg_type == 'read_receipt':
            await self.handle_read_receipt(data)
        elif msg_type == 'voice_call':
            await self.handle_voice_call(data)
        elif msg_type == 'video_call':
            await self.handle_video_call(data)
        elif msg_type == 'delete_message':
            await self.handle_delete_message(data)

    async def handle_chat_message(self, data):
        content = data.get('content', '').strip()
        if not content:
            return

        msg_type = data.get('msg_type', 'text')
        message = await self.save_message(content, msg_type)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message_id': message.id,
                'room_id': self.room_id,
                'sender': {
                    'id': self.user.id,
                    'username': self.user.username,
                    'first_name': self.user.first_name,
                    'avatar': str(self.user.profile.avatar.url) if self.user.profile.avatar else '/static/img/default-avatar.png',
                },
                'content': message.content,
                'msg_type': message.msg_type,
                'timestamp': message.timestamp.isoformat(),
            }
        )

    async def handle_typing(self, data):
        is_typing = data.get('is_typing', False)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'username': self.user.username,
                'is_typing': is_typing,
            }
        )

    async def handle_read_receipt(self, data):
        message_id = data.get('message_id')
        if message_id:
            await self.mark_message_read(message_id)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'read_receipt',
                    'message_id': message_id,
                    'user_id': self.user.id,
                }
            )

    async def handle_voice_call(self, data):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'voice_call',
                'user_id': self.user.id,
                'username': self.user.username,
                'call_type': data.get('type', 'call_initiated'),
            }
        )

    async def handle_video_call(self, data):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'video_call',
                'user_id': self.user.id,
                'username': self.user.username,
                'call_type': data.get('type', 'call_initiated'),
            }
        )

    async def handle_delete_message(self, data):
        message_id = data.get('message_id')
        if message_id:
            await self.delete_message_db(message_id)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'message_deleted',
                    'message_id': message_id,
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message_id': event['message_id'],
            'sender': event['sender'],
            'content': event['content'],
            'msg_type': event['msg_type'],
            'timestamp': event['timestamp'],
        }))

    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing_indicator',
            'user_id': event['user_id'],
            'username': event['username'],
            'is_typing': event['is_typing'],
        }))

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence_update',
            'user_id': event['user_id'],
            'username': event['username'],
            'is_online': event['is_online'],
        }))

    async def read_receipt(self, event):
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'message_id': event['message_id'],
            'user_id': event['user_id'],
        }))

    async def voice_call(self, event):
        await self.send(text_data=json.dumps({
            'type': 'voice_call',
            'user_id': event['user_id'],
            'username': event['username'],
            'call_type': event['call_type'],
        }))

    async def video_call(self, event):
        await self.send(text_data=json.dumps({
            'type': 'video_call',
            'user_id': event['user_id'],
            'username': event['username'],
            'call_type': event['call_type'],
        }))

    async def message_deleted(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'message_id': event['message_id'],
        }))

    @database_sync_to_async
    def save_message(self, content, msg_type='text'):
        room = ChatRoom.objects.get(id=self.room_id)
        message = Message.objects.create(
            room=room,
            sender=self.user,
            content=content,
            msg_type=msg_type,
        )

        for member in room.members.exclude(id=self.user.id):
            MessageStatus.objects.create(message=message, user=member, is_read=False)

        return message

    @database_sync_to_async
    def set_user_online(self, is_online):
        self.user.profile.is_online = is_online
        if not is_online:
            self.user.profile.last_seen = timezone.now()
        self.user.profile.save()

    @database_sync_to_async
    def mark_message_read(self, message_id):
        try:
            message_status = MessageStatus.objects.get(message_id=message_id, user=self.user)
            message_status.is_read = True
            message_status.read_at = timezone.now()
            message_status.save()
        except MessageStatus.DoesNotExist:
            pass

    @database_sync_to_async
    def delete_message_db(self, message_id):
        try:
            message = Message.objects.get(id=message_id, sender=self.user)
            message.delete()
        except Message.DoesNotExist:
            pass


class PresenceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

        await self.channel_layer.group_add('global_presence', self.channel_name)
        await self.accept()

        await self.set_user_online(True)
        await self.channel_layer.group_send(
            'global_presence',
            {
                'type': 'presence_update',
                'user_id': self.user.id,
                'username': self.user.username,
                'is_online': True,
            }
        )

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            await self.set_user_online(False)
            await self.channel_layer.group_send(
                'global_presence',
                {
                    'type': 'presence_update',
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'is_online': False,
                }
            )

        await self.channel_layer.group_discard('global_presence', self.channel_name)

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence_update',
            'user_id': event['user_id'],
            'username': event['username'],
            'is_online': event['is_online'],
        }))

    @database_sync_to_async
    def set_user_online(self, is_online):
        self.user.profile.is_online = is_online
        if not is_online:
            self.user.profile.last_seen = timezone.now()
        self.user.profile.save()
