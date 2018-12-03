import re

from django import template
from home.models import Author

register = template.Library()

""""
Inside author-list.html, the this templatetag is called with an argument wich maps to
the group var. - In template: {% author_group first_author.author.name %})
The group var then maps to an author_group of the same name in the Author model.
"""
@register.inclusion_tag('partials/author-groups.html')
def author_group(group):
    authors = Author.objects.filter(author_group__exact=group)
    return {
        'authors': authors,
    }
