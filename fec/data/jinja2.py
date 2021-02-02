import jinja2
from compressor.contrib.jinja2ext import CompressorExtension


def environment(**options):
    """Create a jinja2 environment with the CompressorExtension added in"""
    options['extensions'] += [CompressorExtension]
    options['autoescape'] = True  # This was already True but we want to set it explicitly
    env = jinja2.Environment(**options)
    return env
