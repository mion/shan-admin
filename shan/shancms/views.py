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
        'shelf_id': 1,
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
