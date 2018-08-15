from django.urls import path

from . import views

app_name = 'shancms' # multiple apps same proj
urlpatterns = [
    path('', views.venue_list, name='venue_list'),
    path('venues/<int:venue_id>', views.venue_detail, name='venue_detail'),
    path('venues/<int:venue_id>/shelfs/<int:shelf_id>', views.shelf_detail, name='shelf_detail'),
    path('venues/<int:venue_id>/shelfs/<int:shelf_id>/calibrate', views.shelf_edit, name='shelf_edit'),
    path('calibration_videos/<int:calibration_video_id>', views.get_calibration_video, name='get_calibration_video'),
    path('calibration_experiments/<int:calibration_video_id>/jobs', views.create_experiment_job, name='create_experiment_job'),
    path('shelves/<int:shelf_id>', views.get_shelf, name='get_shelf'),
    path('shelves/<int:shelf_id>/camera_logs', views.get_camera_logs, name='get_camera_logs'),
    path('shelves/<int:shelf_id>/events', views.save_events, name='save_events'),
    path('shelves/<int:shelf_id>/calibration_videos', views.save_calibration_video, name='save_calibration_video'),
    path('shelves/<int:shelf_id>/calibration_videos/jobs', views.create_record_job, name='create_record_job'),
    path('shelves/<int:shelf_id>/calibration_bundles', views.save_calibration_bundle, name='save_calibration_bundle'),
    path('events', views.get_events, name='get_events')
]
