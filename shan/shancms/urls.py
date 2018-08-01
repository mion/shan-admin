from django.urls import path

from . import views

app_name = 'shancms' # multiple apps same proj
urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('events', views.get_events, name='get_events'),
]
