"""
Django has removed django.utils.six but packages haven't updated their dependencies yet.

So, as of 2020-04-01, the entire contents of this file exists to provide django.utils.six
functionality to those packages who still require it
"""

import sys
import warnings

import django.utils
import django.utils.encoding
import django.shortcuts


class Six:
    string_types = str,
    text_type = str
    next = next


def _compact(cls):
    warnings.warn(f"Remove python_2_unicode_compatible() for {cls}")
    return cls


django.utils.six = Six
django.utils.encoding.python_2_unicode_compatible = _compact
django.shortcuts.render_to_response = django.shortcuts.render
sys.modules['django.utils.six'] = Six
