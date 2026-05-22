from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.db.models import Q, Count
from .models import ChatRoom, Message, RoomMember, MessageStatus
from django.utils import timezone
from apps.accounts.models import FriendRequest, Friend
from django.views.decorators.http import require_http_methods


@login_required
def dashboard_view(request):
    user = request.user
    rooms = ChatRoom.objects.filter(members=user).select_related('created_by').prefetch_related('members')

    room_list = []
    for room in rooms:
        last_msg = room.last_message()
        unread_count = Message.objects.filter(
            room=room,
            statuses__user=user,
            statuses__is_read=False
        ).distinct().count()

        other_user = room.get_other_member(user) if room.room_type == 'direct' else None

        room_list.append({
            'room': room,
            'last_message': last_msg,
            'unread_count': unread_count,
            'other_user': other_user,
        })

    # Get friend requests
    friend_requests = FriendRequest.objects.filter(to_user=user, status='pending')

    # Get current friends
    my_friends = Friend.objects.filter(user=user).values_list('friend_id', flat=True)

    # Get suggested friends (online users not yet friends)
    suggested_friends = User.objects.filter(
        profile__is_online=True
    ).exclude(
        id=user.id
    ).exclude(
        id__in=my_friends
    )[:10]

    context = {
        'rooms': room_list,
        'online_friends': User.objects.filter(profile__is_online=True).exclude(id=user.id)[:10],
        'friend_requests': friend_requests,
        'suggested_friends': suggested_friends,
    }

    return render(request, 'chat/dashboard.html', context)


@login_required
def room_view(request, room_id):
    user = request.user
    room = get_object_or_404(ChatRoom, id=room_id)

    if not room.members.filter(id=user.id).exists():
        return redirect('chat:dashboard')

    messages = room.messages.all().select_related('sender')

    mark_room_as_read(room, user)

    # For direct messages, get the other member's name
    other_user = None
    if room.room_type == 'direct':
        other_user = room.get_other_member(user)

    context = {
        'room': room,
        'messages': messages,
        'room_members': room.room_members.all().select_related('user') if room.room_type == 'group' else None,
        'other_user': other_user,
    }

    return render(request, 'chat/room.html', context)


@login_required
def new_chat_view(request):
    user = request.user

    if request.method == 'POST':
        recipient_id = request.POST.get('recipient_id')
        recipient = get_object_or_404(User, id=recipient_id)

        existing_room = ChatRoom.objects.filter(
            room_type='direct',
            members=user
        ).filter(members=recipient).first()

        if existing_room:
            return redirect('chat:room', room_id=existing_room.id)

        room = ChatRoom.objects.create(
            room_type='direct',
            created_by=user
        )
        room.members.add(user, recipient)

        return redirect('chat:room', room_id=room.id)

    friends = User.objects.filter(profile__is_online=True).exclude(id=user.id)[:20]

    context = {
        'friends': friends,
    }

    return render(request, 'chat/new_chat.html', context)


@login_required
def message_history_view(request, room_id):
    user = request.user
    room = get_object_or_404(ChatRoom, id=room_id)

    if not room.members.filter(id=user.id).exists():
        return JsonResponse({'error': 'Access denied'}, status=403)

    offset = int(request.GET.get('offset', 0))
    limit = int(request.GET.get('limit', 30))

    messages = room.messages.all().select_related('sender')[offset:offset + limit]

    data = {
        'messages': [
            {
                'id': msg.id,
                'sender': {
                    'id': msg.sender.id if msg.sender else None,
                    'username': msg.sender.username if msg.sender else 'System',
                    'avatar': str(msg.sender.profile.avatar.url) if msg.sender else '/static/img/default-avatar.png',
                },
                'content': msg.content,
                'msg_type': msg.msg_type,
                'timestamp': msg.timestamp.isoformat(),
                'is_edited': msg.is_edited,
            }
            for msg in messages
        ]
    }

    return JsonResponse(data)


def mark_room_as_read(room, user):
    message_statuses = MessageStatus.objects.filter(message__room=room, user=user, is_read=False)
    for status in message_statuses:
        status.is_read = True
        status.read_at = timezone.now()
        status.save()

    room_member = RoomMember.objects.filter(room=room, user=user).first()
    if room_member:
        room_member.last_read = timezone.now()
        room_member.save()


@login_required
@require_http_methods(["GET"])
def rooms_view(request):
    user = request.user
    rooms = ChatRoom.objects.filter(members=user).select_related('created_by').prefetch_related('members')

    rooms_list = []
    for room in rooms:
        last_msg = room.last_message()
        other_user = room.get_other_member(user) if room.room_type == 'direct' else None

        rooms_list.append({
            'id': room.id,
            'name': room.name or (other_user.username if other_user else 'Group'),
            'room_type': room.room_type,
            'last_message': last_msg.content if last_msg else None,
            'last_message_time': last_msg.timestamp.isoformat() if last_msg else None,
            'other_user': {
                'id': other_user.id,
                'username': other_user.username,
                'avatar': str(other_user.profile.avatar.url) if other_user and other_user.profile.avatar else '/static/img/default-avatar.png',
            } if other_user else None,
        })

    return JsonResponse({'rooms': rooms_list})


@login_required
@require_http_methods(["GET"])
def search_users(request):
    query = request.GET.get('q', '').strip()
    user = request.user

    if not query or len(query) < 2:
        return JsonResponse({'users': []})

    users = User.objects.filter(
        Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query)
    ).exclude(id=user.id).values('id', 'username', 'first_name', 'last_name', 'profile__avatar')[:10]

    users_list = []
    for user_obj in users:
        avatar_url = None
        if user_obj['profile__avatar']:
            try:
                from apps.accounts.models import UserProfile
                profile = UserProfile.objects.get(user_id=user_obj['id'])
                if profile.avatar:
                    avatar_url = profile.avatar.url
            except:
                pass

        users_list.append({
            'id': user_obj['id'],
            'username': user_obj['username'],
            'first_name': user_obj['first_name'],
            'last_name': user_obj['last_name'],
            'avatar': avatar_url,
        })

    return JsonResponse({'users': users_list})
