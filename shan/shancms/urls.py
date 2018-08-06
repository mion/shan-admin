from django.urls import path

from . import views

app_name = 'shancms' # multiple apps same proj
urlpatterns = [
    path('', views.venues_list, name='venues_list'),
    path('venues/<int:venue_id>', views.venues_detail, name='venues_detail'),
    path('venues/<int:venue_id>/shelfs/<int:shelf_id>', views.shelfs_detail, name='shelfs_detail'),
    path('events', views.get_events, name='get_events'),
]
