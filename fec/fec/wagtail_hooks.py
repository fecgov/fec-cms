from wagtail.wagtailcore import hooks
from django.utils.html import format_html

@hooks.register('construct_whitelister_element_rules')
def whitelister_element_rules():
    tags=["a","abbr","acronym","address","area","b","base","bdo","big","blockquote","body","br","button","caption","cite","code","col","colgroup","dd","del","dfn","div","dl","D\
OCTYPE","dt","em","fieldset","form","h1","h2","h3","h4","h5","h6","head","html","hr","i","img","input","ins","kbd","label","legend","li","link","map","meta","noscript","object","\
ol","optgroup","option","p","param","pre","q","samp","script","select","small","span","strong","style","sub","sup","table","tbody","td","textarea","tfoot","th","thead","title","t\
r","tt","ul","var"]
    return dict((tag, lambda tag: None) for tag in tags)

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
