from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.views.decorators.http import require_http_methods
from django.contrib import messages
from django.http import JsonResponse
from .forms import RegisterForm, LoginForm, ProfileForm
from .models import UserProfile, FriendRequest, Friend
from apps.chat.models import ChatRoom


@require_http_methods(["GET", "POST"])
def register_view(request):
    if request.user.is_authenticated:
        return redirect('chat:dashboard')

    if request.method == 'POST':
        print("\n=== REGISTRATION ATTEMPT ===")
        print(f"POST data keys: {request.POST.keys()}")

        form = RegisterForm(request.POST)
        print(f"Form valid: {form.is_valid()}")

        if not form.is_valid():
            print(f"Form errors: {form.errors}")
            return render(request, 'accounts/register.html', {'form': form})

        try:
            full_name = form.cleaned_data['full_name']
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']

            print(f"Creating user: {email}")

            # Generate unique username from email
            import uuid
            base_username = email.split('@')[0][:15]
            unique_id = str(uuid.uuid4())[:8]
            username = f"{base_username}_{unique_id}"

            print(f"Generated username: {username}")

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=full_name
            )

            print(f"User created successfully: {user.id}")

            login(request, user)
            messages.success(request, f'Welcome {full_name}! Your account has been created.')
            print(f"User logged in and redirecting to dashboard")
            return redirect('chat:dashboard')

        except Exception as e:
            import traceback
            error_detail = traceback.format_exc()
            print(f"ERROR DURING REGISTRATION: {error_detail}")
            messages.error(request, f'Registration error: {str(e)}')
            return render(request, 'accounts/register.html', {'form': form})
    else:
        form = RegisterForm()

    return render(request, 'accounts/register.html', {'form': form})


@require_http_methods(["GET", "POST"])
def login_view(request):
    if request.user.is_authenticated:
        return redirect('chat:dashboard')

    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']

            # Try to authenticate with email - get most recent user if multiple exist
            users = User.objects.filter(email=email).order_by('-date_joined')
            user = None

            if users.exists():
                # Try each user with this email (in case of duplicates)
                for candidate in users:
                    authenticated_user = authenticate(request, username=candidate.username, password=password)
                    if authenticated_user is not None:
                        user = authenticated_user
                        break

            if user is not None:
                login(request, user)
                messages.success(request, f'Welcome back, {user.first_name or user.username}!')
                return redirect('chat:dashboard')
            else:
                messages.error(request, 'Invalid email or password.')
    else:
        form = LoginForm()

    return render(request, 'accounts/login.html', {'form': form})


@require_http_methods(["GET"])
@login_required
def logout_view(request):
    logout(request)
    messages.success(request, 'You have been logged out.')
    return redirect('accounts:login')


@login_required
def profile_view(request, pk=None):
    if pk is None:
        pk = request.user.id

    user = get_object_or_404(User, pk=pk)
    is_own_profile = user.id == request.user.id

    if request.method == 'POST' and is_own_profile:
        form = ProfileForm(request.POST, request.FILES)
        if form.is_valid():
            user.first_name = form.cleaned_data['first_name']
            user.email = form.cleaned_data['email']
            user.save()

            profile = user.profile
            profile.bio = form.cleaned_data['bio']
            profile.phone = form.cleaned_data['phone']

            if 'avatar' in request.FILES:
                profile.avatar = request.FILES['avatar']

            profile.save()
            messages.success(request, 'Profile updated successfully!')
            return redirect('accounts:profile', pk=user.id)
    else:
        if is_own_profile:
            form = ProfileForm(initial={
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'bio': user.profile.bio,
                'phone': user.profile.phone,
            })
        else:
            form = None

    context = {
        'profile_user': user,
        'form': form,
        'is_own_profile': is_own_profile,
    }

    return render(request, 'accounts/profile.html', context)


@login_required
def onboarding_view(request):
    return render(request, 'accounts/onboarding.html')


@login_required
@require_http_methods(["POST"])
def send_friend_request(request, user_id):
    try:
        to_user = get_object_or_404(User, id=user_id)
        from_user = request.user
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

        if from_user == to_user:
            msg = "You cannot add yourself!"
            if is_ajax:
                return JsonResponse({'error': msg}, status=400)
            messages.error(request, msg)
            return redirect('accounts:profile', pk=user_id)

        # Check if already friends
        if Friend.objects.filter(user=from_user, friend=to_user).exists():
            msg = "Already friends!"
            if is_ajax:
                return JsonResponse({'error': msg}, status=400)
            messages.warning(request, msg)
            return redirect('accounts:profile', pk=user_id)

        # Check if request already exists
        existing = FriendRequest.objects.filter(from_user=from_user, to_user=to_user).first()
        if existing:
            if existing.status == 'pending':
                msg = "Request already sent!"
                if is_ajax:
                    return JsonResponse({'error': msg}, status=400)
                messages.warning(request, msg)
            else:
                existing.delete()
                FriendRequest.objects.create(from_user=from_user, to_user=to_user)
                msg = "Friend request sent!"
                if is_ajax:
                    return JsonResponse({'success': msg})
                messages.success(request, msg)
        else:
            FriendRequest.objects.create(from_user=from_user, to_user=to_user)
            msg = "Friend request sent!"
            if is_ajax:
                return JsonResponse({'success': msg})
            messages.success(request, msg)

        if is_ajax:
            return JsonResponse({'success': 'Friend request sent!'})
        return redirect('accounts:profile', pk=user_id)

    except Exception as e:
        print(f"ERROR in send_friend_request: {str(e)}")
        import traceback
        traceback.print_exc()
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'error': str(e)}, status=500)
        messages.error(request, f'Error: {str(e)}')
        return redirect('accounts:profile', pk=user_id)


@login_required
@require_http_methods(["POST"])
def accept_friend_request(request, request_id):
    friend_request = get_object_or_404(FriendRequest, id=request_id, to_user=request.user)

    friend_request.status = 'accepted'
    friend_request.save()

    Friend.objects.create(user=request.user, friend=friend_request.from_user)
    Friend.objects.create(user=friend_request.from_user, friend=request.user)

    # Create ChatRoom between the two users if it doesn't exist
    existing_room = ChatRoom.objects.filter(
        room_type='direct',
        members=request.user
    ).filter(members=friend_request.from_user).first()

    if not existing_room:
        chat_room = ChatRoom.objects.create(
            room_type='direct',
            created_by=request.user
        )
        chat_room.members.add(request.user, friend_request.from_user)

    messages.success(request, f"You are now friends with {friend_request.from_user.first_name}!")
    return redirect('chat:dashboard')


@login_required
@require_http_methods(["POST"])
def reject_friend_request(request, request_id):
    friend_request = get_object_or_404(FriendRequest, id=request_id, to_user=request.user)
    friend_request.status = 'rejected'
    friend_request.save()

    messages.success(request, "Friend request rejected!")
    return redirect('chat:dashboard')
