from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('<int:room_id>/', views.room_view, name='room'),
    path('new/', views.new_chat_view, name='new_chat'),
    path('api/rooms/', views.rooms_view, name='rooms'),
    path('api/messages/<int:room_id>/', views.message_history_view, name='message_history'),
    path('api/search-users/', views.search_users, name='search_users'),
]
