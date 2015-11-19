from html5lib.sanitizer import HTMLSanitizerMixin

from wagtail.wagtailcore import hooks
from django.utils.html import format_html

@hooks.register('construct_whitelister_element_rules')
def whitelister_element_rules():
    checker = lambda tag: None
    return {tag: checker for tag in HTMLSanitizerMixin.acceptable_elements}

@hooks.register('insert_editor_js')
def editor_js():
    return format_html('''
        <script src="/static/js/hallo-edit-html.js"></script>
        <script src="/static/js-beautify/js/lib/beautify-html.js"></script>
        <script src="/static/ace-builds/src-noconflict/ace.js"></script>
        <script src="/static/ace-builds/src-noconflict/mode-html.js"></script>
        <script>
            registerHalloPlugin('editHtmlButton');
        </script>
    ''')
