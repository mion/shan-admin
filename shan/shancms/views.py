import os
import sys
sys.path.append('/Users/gvieira/code/toneto/shan/shan')
sys.path.append('/Users/gvieira/code/toneto/shan/shan/workers')
import datetime
import json

from django.shortcuts import render
from django.http import JsonResponse
from django.utils import dateparse
from django.utils import timezone

from .models import Venue, CalibrationVideo, CalibrationBundle, Shelf, Event
from workers.calib_manager import add_calibration_job

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
    other_calibration_videos = []
    calib_vids = CalibrationVideo.objects.filter(company=shelf.company)
    for vid in calib_vids:
        if (my_calib_video is None) or (my_calib_video['id'] != vid.id):
            other_calibration_videos.append({
                'id': vid.id,
                'recording_date': str(vid.recording_date),
                'video_url': vid.video_url,
                'video_calibration_image_url': 'http://localhost:3601/calib-video-2018-08-01-1415-UTC.jpg'
            })
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
        'other_calibration_videos': other_calibration_videos,
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

def save_calibration_video(request, shelf_id):
    payload = json.loads(request.body)
    recording_date = dateparse.parse_datetime(payload['recording_date']) # ISO format
    s3_key = payload['s3_key']
    shelf = Shelf.objects.get(id=shelf_id)
    video_url = 'https://s3.amazonaws.com/shan-develop/{}'.format(s3_key)
    calib_vid = CalibrationVideo(company=shelf.company, recording_date=recording_date, video_url=video_url)
    calib_vid.save()
    shelf.calibration_video_id = calib_vid.id
    shelf.save()
    return JsonResponse({'success': True}, status=201)

def get_calibration_video(request, calibration_video_id):
    calib_vid = CalibrationVideo.objects.get(id=calibration_video_id)
    return JsonResponse({
        'id': calib_vid.id,
        'video_url': calib_vid.video_url
    })

def save_calibration_bundle(request, shelf_id):
    payload = json.loads(request.body)
    name = payload['name']
    rois_conf = payload['rois_conf']
    tracking_conf = payload['tracking_conf']
    events_conf = payload['events_conf']
    creation_date = datetime.datetime.utcnow().replace(tzinfo=timezone.utc) # FIXME
    calibration_video_id = payload['calibration_video_id']
    calib_vid = CalibrationVideo.objects.get(id=calibration_video_id)
    calib_bundle = CalibrationBundle(name=name, rois_conf=json.dumps(rois_conf), tracking_conf=json.dumps(tracking_conf), events_conf=json.dumps(events_conf), creation_date=creation_date, calibration_video=calib_vid)
    calib_bundle.save()
    shelf = Shelf.objects.get(id=shelf_id)
    shelf.calibration_bundle_id = calib_bundle.id
    shelf.save()
    return JsonResponse({
        'success': True
    }, status=201)
    # name = models.CharField(max_length=200)
    # rois_conf = models.TextField()
    # tracking_conf = models.TextField()
    # events_conf = models.TextField()
    # creation_date = models.DateTimeField('date created')
    # calibration_video = models.ForeignKey(CalibrationVideo, on_delete=models.PROTECT)

def create_record_job(request, shelf_id):
    add_calibration_job(shelf_id)
    return JsonResponse({'success': True}, status=201)

def create_experiment_job(request):
    pass

def get_shelf(request, shelf_id):
    shelf = Shelf.objects.get(id=shelf_id)
    resp = {
        'id': shelf.id,
        'venue_id': shelf.venue_id,
        'company': shelf.company.name,
    }
    if shelf.calibration_bundle_id is not None:
        bundle = CalibrationBundle.objects.get(id=shelf.calibration_bundle_id)
        resp['calibration_bundle'] = {
            'calibration_video_id': bundle.calibration_video_id,
            'rois_conf': json.loads(bundle.rois_conf),
            'tracking_conf': json.loads(bundle.tracking_conf),
            'events_conf': json.loads(bundle.events_conf),
        }
    else:
        resp['calibration_bundle'] = None
    return JsonResponse(resp)

def get_camera_logs(request):
    pass
