from draftjs_exporter.dom import DOM
from wagtail.admin.rich_text.converters.html_to_contentstate import InlineEntityElementHandler

def anchor_entity_decorator(props):

    return DOM.create_element('span', {
        'data-anchor': props['anchor'],
        'id': props['anchor'],
        'style': {
            'fontSize': '2.4rem',
            'margin': '0 0 1em 0',
            'fontFamily': 'gandhi,serif',
            'fontSize': '2rem',
            'fontWeight': '700',
            'lineHeight': '1.2'
        } ,
    }, props['children'])


class AnchorEntityElementHandler(InlineEntityElementHandler):
    mutability = 'IMMUTABLE'

    def get_attribute_data(self, attrs):
        return {
            'anchor': attrs['data-anchor'],
        }
