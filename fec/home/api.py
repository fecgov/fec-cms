from wagtail.api.v2.endpoints import PagesAPIEndpoint, BaseAPIEndpoint
from wagtail.api.v2.router import WagtailAPIRouter
from wagtail.api.v2.filters import FieldsFilter, OrderingFilter, SearchFilter

from cal.models import Event

# Create the router. "wagtailapi" is the URL namespace
api_router = WagtailAPIRouter('wagtailapi')

class EventsAPIEndpoint(BaseAPIEndpoint):
    filter_backends = [
        FieldsFilter,
        OrderingFilter,
        SearchFilter
    ]

    known_query_parameters = [
        'category',
        'state',
        'start_date',
        'end_date',
        'order',
        'per_page',
        'min_start_date',
        'max_start_date',
        '_'
    ]

    body_fields = [
        'start_date',
        'end_date',
        'all_day',
        'category',
        'description',
        'summary',
        'location',
        'state'
    ]
    listing_default_fields = [
        'start_date',
        'end_date',
        'all_day',
        'category',
        'description',
        'summary',
        'location',
        'state'
    ]
    name = 'events'
    model = Event

    def get_queryset(self):
        queryset = self.model.objects.all().order_by('id')
        return queryset

    # def get_object(self):
    #     base = super(PagesAPIEndpoint, self).get_object()
    #     return base.specific

api_router.register_endpoint('events', EventsAPIEndpoint)
