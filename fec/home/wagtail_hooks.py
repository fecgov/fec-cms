from wagtailmodeladmin.options import ModelAdmin, wagtailmodeladmin_register
from .models import Event

class EventAdmin(ModelAdmin):
    model = Event
    list_display = ('start_date', 'end_date', 'description')
    search_fields = ('description', 'summary')
    list_filter = ('category', )

wagtailmodeladmin_register(EventAdmin)
