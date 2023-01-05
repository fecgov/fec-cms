from django import template
from django.contrib.contenttypes.models import ContentType

register = template.Library()


@register.inclusion_tag('partials/reaction-feedback.html')
def reaction_box(template, pid, **kwargs):

    # Docs for below: https://docs.djangoproject.com/en/4.1/ref/contrib/contenttypes/#methods-on-contenttype-instances
    if not kwargs:
        page_type = ContentType.objects.get(app_label='home', model=template)

        page = page_type.get_object_for_this_type(id=pid)
        # page = page_type.objects.get(id=pid)

    # NOTE: CANNOT HAVE TWO ON SAME PAGE USING WAGTAIL BECAUSE 'name', 'title', location get set on the second iteration
    # ...EVEN IF YOU USE ONE AS A BLOCK AND ONE AS HTML

    # TO HARDCODE INTO TEMPLATE IMPORT AT TOP AND THEN LIKE THIS:
    # {% reaction_box page.content_type.model page.id title='Do you like?' location='home' name='home_buttons' %}
        if template == 'resourcepage':
            # Get the raw_data from the main 'sections' StreamField (formerly stream_data)
            all_sections = page.sections.raw_data

            for section in all_sections:
                for item in section.get('value').get('content'):
                    if item.get('type') == 'reaction_feedback':
                        title = item.get('value').get('title')
                        name = item.get('value').get('name')
                        location = item.get('value').get('location')

        elif template == 'custompage':
            body = page.body.raw_data
            for item in body:
                if item.get('type') == 'reaction_feedback':
                    title = item.get('value').get('title', '')
                    name = item.get('value').get('name')
                    location = item.get('value').get('location')

    else:
        title = kwargs['title']
        name = kwargs['name']
        location = kwargs['location']

    return {
        'title': title,
        'name': name,
        'location': location,
        # 'template': template,
        # 'pid' : pid,
    }
