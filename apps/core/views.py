from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.contrib.auth.models import User


def landing_view(request):
    if request.user.is_authenticated:
        return redirect('chat:dashboard')
    return render(request, 'core/landing.html')


@login_required
def settings_view(request):
    if request.method == 'POST':
        theme = request.POST.get('theme', 'dark')
        request.user.profile.theme = theme
        request.user.profile.save()
        return render(request, 'core/settings.html', {'theme_saved': True})

    context = {
        'theme': request.user.profile.theme,
    }
    return render(request, 'core/settings.html', context)


@login_required
def search_view(request):
    query = request.GET.get('q', '').strip()
    results = []

    if query and len(query) >= 2:
        results = User.objects.filter(
            Q(username__icontains=query) |
            Q(email__icontains=query) |
            Q(first_name__icontains=query)
        ).exclude(id=request.user.id)[:10]

    return render(request, 'core/search.html', {
        'query': query,
        'results': results,
    })
