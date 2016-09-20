from html5lib.sanitizer import HTMLSanitizerMixin

from wagtail.wagtailcore.whitelist import attribute_rule, check_url, allow_without_attributes
from wagtail.wagtailcore import hooks
from django.utils.html import format_html

@hooks.register('construct_whitelister_element_rules')
def whitelister_element_rules():
    return {
        # Commenting out disallowed tags so its easier to remember & revert
        'a': attribute_rule({'href': check_url}),
        'b': allow_without_attributes,
        # 'br': allow_without_attributes,
        # 'div': allow_without_attributes,
        'em': allow_without_attributes,
        'h1': allow_without_attributes,
        'h2': allow_without_attributes,
        'h3': allow_without_attributes,
        'h4': allow_without_attributes,
        'h5': allow_without_attributes,
        'h6': allow_without_attributes,
        'hr': allow_without_attributes,
        'i': allow_without_attributes,
        'img': attribute_rule({'src': check_url, 'width': True, 'height': True,
                               'alt': True}),
        'li': allow_without_attributes,
        'ol': allow_without_attributes,
        'p': allow_without_attributes,
        'strong': allow_without_attributes,
        'sub': allow_without_attributes,
        'sup': allow_without_attributes,
        'ul': allow_without_attributes,
    }

@hooks.register('insert_editor_js')
def editor_js():
    return format_html('''
        <script src="/static/js/vendor/jquery.htmlClean.min.js"></script>
        <script src="/static/js/vendor/rangy-core.js"></script>
        <script src="/static/js/vendor/rangy-selectionsaverestore.js"></script>
        <script src="/static/js/hallo-edit-html.js"></script>
        <script src="/static/js/customize-editor.js"></script>
        <script src="/static/js-beautify/js/lib/beautify-html.js"></script>
        <script src="/static/ace-builds/src-noconflict/ace.js"></script>
        <script src="/static/ace-builds/src-noconflict/mode-html.js"></script>
        <script>
            registerHalloPlugin('editHtmlButton');
            registerHalloPlugin('hallocleanhtml');
        </script>
    ''')

@hooks.register('insert_editor_css')
def editor_css():
    return format_html(
        '<link rel="stylesheet" href="/static/css/customize-editor.css">'
    )
