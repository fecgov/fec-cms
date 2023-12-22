from wagtail.snippets.models import register_snippet
from wagtail.snippets.views.snippets import (SnippetViewSet, SnippetViewSetGroup,
                                             IndexView)
from wagtail.admin.panels import TabbedInterface, ObjectList

from wagtail import hooks

from home.models import (Author, PressReleasePage, DigestPage,
                     TipsForTreasurersPage, RecordPage, CustomPage)


class AuthorSnippetView(SnippetViewSet):
    model = Author
    menu_icon = 'user'
    menu_order = 300  # will put in 3rd place (000 being 1st, 100 2nd)
    add_to_settings_menu = False  # or True to add your model to the Settings sub-menu
    list_display = ('name', 'title', 'email')
    list_filter = ()
    search_fields = ('name', 'title', 'email')
    add_to_admin_menu = True  # When set to false, with wagtail5 this shows under snippet menu

@hooks.register('get_updates_id(')
def get_updates_id():
    page = CustomPage.objects.live().get(slug__exact="updates")
    page = CustomPage.objects.live().filter(slug__exact="updates").first().id
    pg_id = page
    return pg_id

@hooks.register('page_edit_handler')
def page_edit_handler(model):
    return TabbedInterface([
        ObjectList(model.content_panels, heading='Content'),
        ObjectList(model.promote_panels, heading='Promote'),
    ])
   

class UpdatesSnippetView(IndexView):
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["updates_id"] = get_updates_id()
        context["instance"] = IndexView.get_base_queryset(self).model.__name__
        return context


class PressReleaseSnippetView(SnippetViewSet):
    menu_label = 'Press releases'
    model = PressReleasePage
    ordering = ['-date']
    list_display = ('title', 'date', 'category')
    index_view_class = UpdatesSnippetView
    index_template_name = 'snippets/index_custom_button.html'
    edit_handler = page_edit_handler(model)


class DigestPageSnippetView(SnippetViewSet):
    menu_label = 'Weekly digests'
    model = DigestPage
    ordering = ['-date']
    list_display = ('title', 'date')
    index_view_class = UpdatesSnippetView
    index_template_name = 'snippets/index_custom_button.html'
    edit_handler = page_edit_handler(model)


class TipsForTreasurersPageSnippetView(SnippetViewSet):
    menu_label = 'Tips for Treasurers'
    model = TipsForTreasurersPage
    ordering = ['-date']
    list_display = ('title', 'date')
    index_view_class = UpdatesSnippetView
    index_template_name = 'snippets/index_custom_button.html'
    edit_handler = page_edit_handler(model)


class RecordPageSnippetView(SnippetViewSet):
    menu_label = 'FEC Record'
    model = RecordPage
    ordering = ['-date']
    list_display = ('title', 'date', 'category')
    index_view_class = UpdatesSnippetView
    index_template_name = 'snippets/index_custom_button.html'
    edit_handler = page_edit_handler(model)


class NewsAndUpdatesSnippetView(SnippetViewSetGroup):
    menu_label = 'News and updates'
    menu_icon = 'folder-open-inverse'
    menu_order = 200
    items = (PressReleaseSnippetView, DigestPageSnippetView,
             TipsForTreasurersPageSnippetView, RecordPageSnippetView)
    add_to_admin_menu = True


register_snippet(AuthorSnippetView)
register_snippet(NewsAndUpdatesSnippetView)
