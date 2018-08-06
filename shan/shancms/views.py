from django.shortcuts import render
from django.http import JsonResponse

import json

from .models import Event

def venues_list(request):
    ctx = {
        'current_user': {
            'email': 'gluisvieira@gmail.com'
        },
        'venues_count': 3,
        'venues': [
            {
                'id': 1,
                'name': 'Prezunic',
                'address': 'Rua General Polidoro 308 - Rio de Janeiro, RJ - 22470010 - Brasil'
            },
            {
                'id': 2,
                'name': 'Walmart WL',
                'address': 'Avenida Washington Luis 319 - Rio de Janeiro, RJ - 22470010 - Brasil'
            },
        ]
    }
    return render(request, 'shancms/venues_list.html', ctx)

def venues_detail(request, venue_id):
    ctx = {
        'current_user': {
            'email': 'gluisvieira@gmail.com'
        },
        'venue': {
            'id': 1,
            'name': 'Prezunic'
        },
        'shelves_count': 2,
        'shelves': [
            {
                'id': 1,
                'name': 'CORREDOR GARRAFAS PET 2L',
                'status': 'online',
                'status_time': '11 days'
            },
            {
                'id': 2,
                'name': 'GONDOLA PREMIUM COCA-COLA',
                'status': 'offline',
                'status_time': '2 hours'
            }
        ]
    }
    return render(request, 'shancms/venues_detail.html', ctx)

def shelfs_detail(request, venue_id, shelf_id):
    ctx = {
        'shelf': {'id': 1},
        'venue': {
            'id': 1,
            'name': 'Prezunic'
        },
        'current_user': {
            'email': 'gluisvieira@gmail.com'
        },
        'first_date': 'Mon 6 Aug, 2018',
        'last_date': 'Mon 9 Dec, 2018',
    }
    return render(request, 'shancms/shelfs_detail.html', ctx)

def shelfs_calibrate(request, venue_id, shelf_id):
    ctx = {
        'shelf': {'id': 1},
        'venue': {
            'id': 1,
            'name': 'Prezunic'
        },
        'calibration_params_jsonstr': json.dumps({
            'tracking_conf': {
                'foo': 123,
            },
            'rois_conf': {
                'shelf': {
                    'x': 0, 'y': 0, 'width': 100, 'height': 50
                },
            },
            'events_conf': {
                'max_distance': 50
            },
        }),
        'my_calibration_video': {
            'id': 1,
            'recording_date': '2018/08/01 14:15 (UTC)',
            'video_url': 'http://localhost:3601/calib-video-2018-08-01-1415-UTC.mp4',
            'video_calibration_image_url': 'http://localhost:3601/calib-video-2018-08-01-1415-UTC.jpg',
        },
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
        'current_user': {
            'email': 'gluisvieira@gmail.com'
        },
    }
    return render(request, 'shancms/shelfs_calibrate.html', ctx)

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
