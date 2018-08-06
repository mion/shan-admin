from django.urls import path

from . import views

app_name = 'shancms' # multiple apps same proj
urlpatterns = [
    path('', views.venue_list, name='venue_list'),
    path('venues/<int:venue_id>', views.venue_detail, name='venue_detail'),
    path('venues/<int:venue_id>/shelfs/<int:shelf_id>', views.shelf_detail, name='shelf_detail'),
    path('venues/<int:venue_id>/shelfs/<int:shelf_id>/calibrate', views.shelf_edit, name='shelf_edit'),
    path('events', views.get_events, name='get_events'),
]
