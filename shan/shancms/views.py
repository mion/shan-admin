from django.shortcuts import render
from django.http import JsonResponse
from django.utils import dateparse
from django.utils import timezone

import json

from .models import Venue, CalibrationVideo, CalibrationBundle, Shelf, Event

def venue_list(request):
    venues = Venue.objects.all() # TODO filter for current user
    venues_json = []
    for venue in venues:
        venues_json.append({
            'id': venue.id,
            'name': venue.name,
            'address': venue.address
        })
    ctx = {
        'current_user': {
            'email': 'gluisvieira@gmail.com'
        },
        'venues_count': len(venues),
        'venues': venues_json
    }
    return render(request, 'shancms/venue_list.html', ctx)

def venue_detail(request, venue_id):
    venue = Venue.objects.get(id=venue_id)
    shelves = Shelf.objects.filter(venue_id=venue_id)
    shelves_json = []
    for shelf in shelves:
        shelves_json.append({
            'id': shelf.id,
            'name': shelf.name,
            'status': 'online', # TODO implement status
            'status_time': '1 day'
        })
    ctx = {
        'current_user': {
            'email': 'gluisvieira@gmail.com'
        },
        'venue': {
            'id': venue.id,
            'name': venue.name
        },
        'shelves_count': len(shelves),
        'shelves': shelves_json
    }
    return render(request, 'shancms/venue_detail.html', ctx)

def shelf_detail(request, venue_id, shelf_id):
    venue = Venue.objects.get(id=venue_id)
    shelf = Shelf.objects.get(id=shelf_id)
    events = Event.objects.filter(shelf_id=shelf_id)
    ctx = {
        'current_user': {
            'email': 'gluisvieira@gmail.com'
        },
        'shelf': {'id': shelf.id},
        'venue': {
            'id': venue.id,
            'name': venue.name
        },
        'events_count': len(events)
    }
    return render(request, 'shancms/shelf_detail.html', ctx)

def shelf_edit(request, venue_id, shelf_id):
    shelf = Shelf.objects.get(id=shelf_id)
    venue = Venue.objects.get(id=venue_id)
    calibration_bundle = None if shelf.calibration_bundle_id is None else CalibrationBundle.objects.get(id=shelf.calibration_bundle_id)
    calibration_video = None if calibration_bundle is None else CalibrationVideo.objects.get(id=calibration_bundle.calibration_video_id)
    my_calib_video = None
    if calibration_video is not None:
        my_calib_video = {
            'id': calibration_video.id,
            'recording_date': str(calibration_video.recording_date), # TODO fix date str rep
            'video_url': calibration_video.video_url,
            'video_calibration_image_url': 'http://localhost:3601/calib-video-2018-08-01-1415-UTC.jpg'
        }
    ctx = {
        'current_user': {
            'email': 'gluisvieira@gmail.com'
        },
        'shelf': {'id': shelf.id},
        'venue': {
            'id': venue.id,
            'name': venue.name
        },
        'calibration_params_jsonstr': json.dumps({
            'tracking_conf': {} if calibration_bundle is None else calibration_bundle.tracking_conf,
            'rois_conf': {} if calibration_bundle is None else calibration_bundle.rois_conf,
            'events_conf': {} if calibration_bundle is None else calibration_bundle.events_conf,
        }),
        'my_calibration_video': my_calib_video,
        'tests_count': 2,
        'tests': [
            {
                'status': 'progress 0.85',
                'creation_date': '2018/08/01 12:30 (UTC)',
                'result_video_url': 'http://localhost:3601/test-result-12345678.mp4',
            }
        ],
        'other_calibration_videos': [
            {
                'id': 2,
                'recording_date': '2018/07/31 17:58 (UTC)',
                'video_url': 'http://localhost:3601/calib-video-2018-08-01-1415-UTC.mp4',
                'video_calibration_image_url': 'http://localhost:3601/calib-video-2018-08-01-1415-UTC.jpg',
            },
            {
                'id': 3,
                'recording_date': '2018/07/31 16:29 (UTC)',
                'video_url': 'http://localhost:3601/calib-video-2018-08-01-1415-UTC.mp4',
                'video_calibration_image_url': 'http://localhost:3601/calib-video-2018-08-01-1415-UTC.jpg',
            }
        ],
    }
    return render(request, 'shancms/shelf_edit.html', ctx)

def get_events(request):
    shelf_id_str = request.GET.get('shelf_id', None)
    if shelf_id_str is None:
        return JsonResponse({'events': []})
    shelf_id = int(shelf_id_str)
    events = Event.objects.filter(shelf_id=shelf_id).order_by('creation_date')
    evt_objs = []
    for evt in events:
        obj = {'type': evt.event_type, 'date': evt.creation_date, 'params': json.loads(evt.event_params)}
        evt_objs.append(obj)
    return JsonResponse({'shelf_id': shelf_id, 'events': evt_objs})

# check this out
#@csrf_exempt
def save_events(request, shelf_id):
    payload = json.loads(request.body)
    events = payload['events']
    shelf = Shelf.objects.get(id=shelf_id)
    # Save the calibration bundle against which these events were extracted.
    calib_bundle = CalibrationBundle.objects.get(id=shelf.calibration_bundle_id)
    for evt in events:
        event_type = evt['event_type']
        event_params = evt['event_params']
        creation_date = dateparse.parse_datetime(evt['creation_date'])
        if not timezone.is_aware(creation_date):
            # print("WARNING: received creation date that was not timezone aware")
            creation_date = timezone.make_aware(creation_date, timezone.utc)
        e = Event(event_type=event_type, event_params=json.dumps(event_params), creation_date=creation_date, shelf=shelf, calibration_bundle=calib_bundle)
        e.save()
    return JsonResponse({'success': True}, status=201)

def create_record_job(request):
    pass

def create_experiment_job(request):
    pass

def shelf_update(request):
    pass

def get_camera_logs(request):
    pass
