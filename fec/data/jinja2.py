import jinja2
from compressor.contrib.jinja2ext import CompressorExtension

def environment(**options):
    """Create a jinja2 environment with the CompressorExtension added in"""
    options['extensions'] += [CompressorExtension]
    env = jinja2.Environment(**options)
    return env
