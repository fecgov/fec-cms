from draftjs_exporter.dom import DOM
from wagtail.admin.rich_text.converters.html_to_contentstate import InlineEntityElementHandler

def sansserif_entity_decorator(props):
    """
    Draft.js ContentState to database HTML.
    Converts the GLOSSARY entities into a span tag.
    """
    return DOM.create_element('span', {
        'class': 't-sans',
    }, props['children'])


class SansserifEntityElementHandler(InlineEntityElementHandler):
    """
    Database HTML to Draft.js ContentState.
    Converts the span tag into a SANSSERIF entity, with the right data.
    """
    mutability = 'IMMUTABLE'
