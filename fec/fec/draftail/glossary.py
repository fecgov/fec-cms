from draftjs_exporter.dom import DOM
from wagtail.admin.rich_text.converters.html_to_contentstate import InlineEntityElementHandler

def glossary_entity_decorator(props):
    """
    Draft.js ContentState to database HTML.
    Converts the GLOSSARY entities into a span tag.
    """
    return DOM.create_element('span', {
        'data-term': props['term'],
        'class': 'term',
    }, props['children'])


class GlossaryEntityElementHandler(InlineEntityElementHandler):
    """
    Database HTML to Draft.js ContentState.
    Converts the span tag into a GLOSSARY entity, with the right data.
    """
    mutability = 'IMMUTABLE'

    def get_attribute_data(self, attrs):
        """
        Take the ``glossary`` value from the ``data-term`` HTML attribute.
        """
        return {
            'term': attrs['data-term'],
        }