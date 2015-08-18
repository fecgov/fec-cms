"""Custom SASS compiler that fixes paths for relative includes.
From https://github.com/django-compressor/django-compressor/issues/226.
"""
from compressor.filters.css_default import CssAbsoluteFilter
from django_libsass import SassCompiler

class PatchedSCSSCompiler(SassCompiler):
    def input(self, **kwargs):
        content = super(PatchedSCSSCompiler, self).input(**kwargs)
        kwargs.setdefault('filename', self.filename)
        return CssAbsoluteFilter(content).input(**kwargs)
