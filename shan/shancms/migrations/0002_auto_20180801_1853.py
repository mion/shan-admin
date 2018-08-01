# Generated by Django 2.0.7 on 2018-08-01 18:53

from django.db import migrations
from django.utils import timezone
from datetime import timedelta
import json
import random

def create_dummy_data(apps, schema_editor):
    Company = apps.get_model('shancms', 'Company')
    Venue = apps.get_model('shancms', 'Venue')
    CalibrationVideo = apps.get_model('shancms', 'CalibrationVideo')
    CalibrationBundle = apps.get_model('shancms', 'CalibrationBundle')
    Shelf = apps.get_model('shancms', 'Shelf')
    Event = apps.get_model('shancms', 'Event')

    c = Company(name="MyFakeCompany")
    c.save()

    v = Venue(name="MyFakeVenue", address="Rua da Mentira 123")
    v.save()

    calib_video = CalibrationVideo(video_url="http://localhost:3601/calib-video-2018-08-01-1415-UTC.mp4", recording_date=timezone.now(), company=c)
    calib_video.save()

    calib_bundle = CalibrationBundle(name="calib1", rois_conf="{}", tracking_conf="{}", events_conf="{}", creation_date=timezone.now(), calibration_video=calib_video)
    calib_bundle.save()

    shelf = Shelf(name="shelf1", venue=v, company=c, calibration_bundle=calib_bundle)
    shelf.save()

    # create events
    today = timezone.now()
    DAYS = 90
    TYPES = ["walked", "pondered", "interacted"]
    for d in range(1, DAYS + 1):
        dt = today - timedelta(days=d)
        for _ in range(random.randrange(5, 50)):
            evt_type = random.choice(TYPES)
            params = "{}" if evt_type != "pondered" else json.dumps({"duration": random.randrange(3000, 9000)})
            creat_date = dt - timedelta(minutes=random.randrange(-300, +300))
            event = Event(event_type=evt_type, event_params=params, creation_date=creat_date, shelf=shelf, calibration_bundle=calib_bundle)
            event.save()

class Migration(migrations.Migration):

    dependencies = [
        ('shancms', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_dummy_data)
    ]