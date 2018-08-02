from django.shortcuts import render
from django.http import JsonResponse

import json

from .models import Event

def dashboard(request):
    ctx = {}
    return render(request, 'shancms/dashboard.html', ctx)

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
