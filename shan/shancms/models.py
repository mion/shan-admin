from django.db import models


class Company(models.Model):
    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class Venue(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField(max_length=300)

    def __str__(self):
        return self.name


class CalibrationVideo(models.Model):
    video_url = models.CharField(max_length=1000)
    company = models.ForeignKey(Company, on_delete=models.PROTECT)
    recording_date = models.DateTimeField('date recorded')

    def __str__(self):
        return self.video_url


class CalibrationBundle(models.Model):
    name = models.CharField(max_length=200)
    rois_conf = models.TextField()
    tracking_conf = models.TextField()
    events_conf = models.TextField()
    creation_date = models.DateTimeField('date created')
    calibration_video = models.ForeignKey(CalibrationVideo, on_delete=models.PROTECT)

    def __str__(self):
        return self.name


class Shelf(models.Model):
    name = models.CharField(max_length=200)
    venue = models.ForeignKey(Venue, on_delete=models.PROTECT)
    company = models.ForeignKey(Company, on_delete=models.PROTECT)
    calibration_bundle = models.ForeignKey(CalibrationBundle, on_delete=models.SET_NULL, blank=True, null=True)

    def __str__(self):
        return self.name


class Event(models.Model):
    event_type = models.CharField(max_length=200)
    event_params = models.TextField()
    creation_date = models.DateTimeField('date created')
    shelf = models.ForeignKey(Shelf, on_delete=models.PROTECT)
    # This redundancy is because we want to know which calib bundle was this event
    # attached to, in case the shelf has a new calib bundle attached to it.
    calibration_bundle = models.ForeignKey(CalibrationBundle, on_delete=models.PROTECT)
