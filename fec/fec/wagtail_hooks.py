import json
import wagtail.admin.rich_text.editors.draftail.features as draftail_features
from wagtail.admin.rich_text.converters.html_to_contentstate import BlockElementHandler
from wagtail import hooks
from django.conf import settings
from django.utils.html import format_html
from fec.draftail import glossary, sansserif, anchor


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
def register_anchor_feature(features):
    features.default_features.append('anchor')
    """
    Registering the `anchor` feature, which uses the `Anchor` Draft.js entity type,
    and is stored as HTML with a `<a data-anchor>` tag.
    """
    feature_name = 'anchor'
    type_ = 'ANCHOR'

    control = {
        'type': type_,
        'label': '#',
        'description': 'Anchor',
    }

    features.register_editor_plugin(
        'draftail', feature_name, draftail_features.EntityFeature(
            control,
            js=[
                '/static/wagtailadmin/js/draftail.js',
                draftail_js(),
            ]
        )
    )

    features.register_converter_rule('contentstate', feature_name, {
        # Note here that the conversion is more complicated than for blocks and inline styles.
        'from_database_format': {'span[data-anchor]': anchor.AnchorEntityElementHandler(type_)},
        'to_database_format': {'entity_decorators': {type_: anchor.anchor_entity_decorator}},
    })


@hooks.register('register_rich_text_features')
def register_glossary_feature(features):
    features.default_features.append('glossary')
    """
    Registering the `glossary` feature, which uses the `GLOSSARY` Draft.js entity type,
    and is stored as HTML with a `<span data-term>` tag.
    """
    feature_name = 'glossary'
    type_ = 'GLOSSARY'

    control = {
        'type': type_,
        'label': 'Glossary',
        'description': 'Glossary',
    }

    features.register_editor_plugin(
        'draftail', feature_name, draftail_features.EntityFeature(control)
    )

    features.register_converter_rule('contentstate', feature_name, {
        # Call register_converter_rule to register the content transformation conversion
        'from_database_format': {'span[data-term]': glossary.GlossaryEntityElementHandler(type_)},
        'to_database_format': {'entity_decorators': {type_: glossary.glossary_entity_decorator}},
    })


@hooks.register('register_rich_text_features')
def register_sansserif_feature(features):
    features.default_features.append('sansserif')
    """
    Registering the `sansserif` feature, which uses the `SANSSERIF` Draft.js entity type,
    and is stored as HTML with a `<span>` tag.
    """
    feature_name = 'sansserif'
    type_ = 'SANSSERIF'

    control = {
        'type': type_,
        'label': 'SS',
        'description': 'Sans Serif font',
    }

    features.register_editor_plugin(
        'draftail', feature_name, draftail_features.EntityFeature(control)
    )

    features.register_converter_rule('contentstate', feature_name, {
        # Call register_converter_rule to register the content transformation conversion
        'from_database_format': {'span': sansserif.SansserifEntityElementHandler(type_)},
        'to_database_format': {'entity_decorators': {type_: sansserif.sansserif_entity_decorator}},
    })


def draftail_js():
    """Looks up the hashed asset path in rev-draftail-manifest-js.json
    If the path doesn't exist there, then just return the path to the static file
    without a hash"""
    key = '/static/js/draftail.js'
    assets = json.load(open(settings.DIST_DIR + '/fec/static/js/rev-manifest-js.json'))
    return assets[key] if key in assets else key


@hooks.register('insert_global_admin_css')
def editor_css():
    return format_html(
        '<link rel="stylesheet" href="/static/css/customize-editor.css">'
    )
