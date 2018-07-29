from django.urls import path

from . import views

app_name = 'shancms' # multiple apps same proj
urlpatterns = [
    path('', views.dashboard, name='dashboard'),
]
