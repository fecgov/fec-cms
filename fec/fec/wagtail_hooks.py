from wagtail.wagtailcore.whitelist import attribute_rule, check_url, allow_without_attributes
from wagtail.wagtailcore import hooks
from django.utils.html import format_html

@hooks.register('construct_whitelister_element_rules')
def whitelister_element_rules():
    return {
        'span': attribute_rule({'class': True}),
        'blockquote': attribute_rule({'class': True}),
    }

@hooks.register('insert_editor_js')
def editor_js():
    return format_html('''
        <script src="/static/js/vendor/jquery.htmlClean.min.js"></script>
        <script src="/static/js/vendor/rangy-core.js"></script>
        <script src="/static/js/vendor/rangy-selectionsaverestore.js"></script>
        <script src="/static/js/hallo-edit-html.js"></script>
        <script src="/static/js/hallo-sans-serif.js"></script>
        <script src="/static/js/hallo-blockquote.js"></script>
        <script src="/static/js/customize-editor.js"></script>
        <script src="/static/js-beautify/js/lib/beautify-html.js"></script>
        <script src="/static/ace-builds/src-noconflict/ace.js"></script>
        <script src="/static/ace-builds/src-noconflict/mode-html.js"></script>
        <script>
            registerHalloPlugin('editHtmlButton');
            registerHalloPlugin('hallocleanhtml');
            registerHalloPlugin('sansSerifButton');
            registerHalloPlugin('blockquotebutton');
        </script>
    ''')

@hooks.register('insert_editor_css')
def editor_css():
    return format_html(
        '<link rel="stylesheet" href="/static/css/customize-editor.css">'
    )
