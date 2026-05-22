from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.landing_view, name='landing'),
    path('settings/', views.settings_view, name='settings'),
    path('search/', views.search_view, name='search'),
]
