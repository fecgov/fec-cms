from wagtail.snippets.models import register_snippet
from wagtail.snippets.views.snippets import SnippetViewSet, SnippetViewSetGroup
from .models import (Author, PressReleasePage, DigestPage,
                     TipsForTreasurersPage, RecordPage)


class AuthorSnippetView(SnippetViewSet):
    model = Author
    menu_icon = 'user'
    menu_order = 300  # will put in 3rd place (000 being 1st, 100 2nd)
    add_to_settings_menu = False  # or True to add your model to the Settings sub-menu
    list_display = ('name', 'title', 'email')
    list_filter = ()
    search_fields = ('name', 'title', 'email')
    add_to_admin_menu = True  # When set to false, with wagtail5 this shows under snippet menu


class PressReleaseSnippetView(SnippetViewSet):
    menu_label = 'Press releases'
    model = PressReleasePage
    ordering = ['-date']
    list_display = ('title', 'date', 'category')


class DigestPageSnippetView(SnippetViewSet):
    menu_label = 'Weekly digests'
    model = DigestPage
    ordering = ['-date']
    list_display = ('title', 'date')


class TipsForTreasurersPageSnippetView(SnippetViewSet):
    menu_label = 'Tips for Treasurers'
    model = TipsForTreasurersPage
    ordering = ['-date']
    list_display = ('title', 'date')


class RecordPageSnippetView(SnippetViewSet):
    menu_label = 'FEC Record'
    model = RecordPage
    ordering = ['-date']
    list_display = ('title', 'date', 'category')


class NewsAndUpdatesSnippetView(SnippetViewSetGroup):
    menu_label = 'News and updates'
    menu_icon = 'folder-open-inverse'
    menu_order = 200
    items = (PressReleaseSnippetView, DigestPageSnippetView,
             TipsForTreasurersPageSnippetView, RecordPageSnippetView)


register_snippet(AuthorSnippetView)
register_snippet(NewsAndUpdatesSnippetView)
