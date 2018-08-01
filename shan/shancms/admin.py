from django.contrib import admin

# Register your models here.

from .models import Company, Venue, CalibrationVideo, CalibrationBundle, Shelf, Event

admin.site.register(Company)
admin.site.register(Venue)
admin.site.register(CalibrationVideo)
admin.site.register(CalibrationBundle)
admin.site.register(Shelf)
admin.site.register(Event)
