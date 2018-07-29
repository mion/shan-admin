from django.db import models


class Company(models.Model):
    name = models.CharField(max_length=200)


class Venue(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField(max_length=300)


class CalibrationVideo(models.Model):
    video_url = models.CharField(max_length=1000)
    company = models.ForeignKey(Company, on_delete=models.PROTECT)
    recording_date = models.DateTimeField('date recorded')


class CalibrationBundle(models.Model):
    name = models.CharField(max_length=200)
    rois_conf = models.TextField()
    tracking_conf = models.TextField()
    events_conf = models.TextField()
    creation_date = models.DateTimeField('date created')
    calibration_video = models.ForeignKey(CalibrationVideo, on_delete=models.PROTECT)


class Shelf(models.Model):
    name = models.CharField(max_length=200)
    venue = models.ForeignKey(Venue, on_delete=models.PROTECT)
    company = models.ForeignKey(Company, on_delete=models.PROTECT)
    calibration_bundle = models.ForeignKey(CalibrationBundle, on_delete=models.SET_NULL, blank=True, null=True)


class Event(models.Model):
    event_type = models.CharField(max_length=200)
    event_params = models.TextField()
    creation_date = models.DateTimeField('date created')
    shelf = models.ForeignKey(Shelf, on_delete=models.PROTECT)
    calibration_bundle = models.ForeignKey(CalibrationBundle, on_delete=models.PROTECT)
