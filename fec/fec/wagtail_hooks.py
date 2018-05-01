import wagtail.admin.rich_text.editors.draftail.features as draftail_features
from wagtail.admin.rich_text.converters.html_to_contentstate import InlineStyleElementHandler, BlockElementHandler
from wagtail.admin.rich_text.converters.editor_html import WhitelistRule
from wagtail.core import hooks
from wagtail.core.whitelist import attribute_rule, check_url, allow_without_attributes
from django.utils.html import format_html
from fec.draftail import sansserif


@hooks.register('register_rich_text_features')
def register_blockquote_feature(features):
    """
    Registering the `blockquote` feature, which uses the `blockquote` Draft.js block type,
    and is stored as HTML with a `<blockquote>` tag.
    """
    feature_name = 'blockquote'
    type_ = 'blockquote'
    tag = 'blockquote'

    control = {
        'type': type_,
        'label': '❝',
        'description': 'Blockquote',
        # Optionally, we can tell Draftail what element to use when displaying those blocks in the editor.
        'element': 'blockquote',
    }

    features.register_editor_plugin(
        'draftail', feature_name, draftail_features.BlockFeature(control)
    )

    features.register_converter_rule('contentstate', feature_name, {
        'from_database_format': {tag: BlockElementHandler(type_)},
        'to_database_format': {'block_map': {type_: tag}},
    })

    features.default_features.append(feature_name)




@hooks.register('register_rich_text_features')
def register_stock_feature(features):
    features.default_features.append('stock')
    """
    Registering the `stock` feature, which uses the `STOCK` Draft.js entity type,
    and is stored as HTML with a `<span data-stock>` tag.
    """
    feature_name = 'stock'
    type_ = 'STOCK'

    control = {
        'type': type_,
        'label': '$',
        'description': 'Stock',
    }

    features.register_editor_plugin(
        'draftail', feature_name, draftail_features.EntityFeature(control)
    )

    features.register_converter_rule('contentstate', feature_name, {
        # Note here that the conversion is more complicated than for blocks and inline styles.
        'from_database_format': {'span[data-stock]': sansserif.StockEntityElementHandler(type_)},
        'to_database_format': {'entity_decorators': {type_: sansserif.stock_entity_decorator}},
    })


@hooks.register('insert_editor_js')
def editor_js():
    return format_html('''
        <script src="/static/js/vendor/jquery.htmlClean.min.js"></script>
        <script src="/static/rangy/lib/rangy-core.js"></script>
        <script src="/static/rangy/lib/rangy-selectionsaverestore.js"></script>
        <script src="/static/js/vendor/beautify-html.js"></script>
        <script src="/static/js/admin/hallo-edit-html.js"></script>
        <script src="/static/js/admin/hallo-sans-serif.js"></script>
        <script src="/static/js/admin/hallo-blockquote.js"></script>
        <script src="/static/js/admin/customize-editor.js"></script>
        <script src="/static/ace-builds/src-noconflict/ace.js"></script>
        <script src="/static/ace-builds/src-noconflict/mode-html.js"></script>
        <script>
            registerHalloPlugin('editHtmlButton');
            registerHalloPlugin('hallocleanhtml');
            registerHalloPlugin('sansSerifButton');
        </script>
        <script src="/static/wagtailadmin/js/draftail.js"></script>
        <script src="/static/js/admin/sansserif.js"></script>

    ''')

@hooks.register('insert_editor_css')
def editor_css():
    return format_html(
        '<link rel="stylesheet" href="/static/css/customize-editor.css">'
    )

