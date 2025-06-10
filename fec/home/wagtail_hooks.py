from wagtail.admin.viewsets.base import ViewSet
from wagtail.admin.viewsets.base import ViewSetGroup
from wagtail.admin.viewsets.model import ModelViewSet
from wagtail.admin.viewsets.pages import PageListingViewSet
from wagtail import hooks
from home.models import (Author, PressReleasePage, DigestPage,
                         TipsForTreasurersPage, RecordPage, CustomPage)


class AuthorModelViewSet(ModelViewSet):
    model = Author
    menu_icon = 'user'
    menu_order = 500
    add_to_settings_menu = False  # or True to add your model to the Settings sub-menu
    list_display = ('name', 'title', 'email')
    search_fields = ('name', 'title', 'email')
    icon = 'user'
    menu_icon = 'group'
    add_to_admin_menu = True  # When set to false, with wagtail this shows under snippet menu
    name = 'authors'

author_model_view_set = AuthorModelViewSet("authors")

@hooks.register("register_admin_viewset")
def register_viewset():
    return author_model_view_set

class PressReleaseListingView(PageListingViewSet):
    menu_label = 'Press releases'
    model = PressReleasePage
    ordering = ['-date']
    list_display = ('title', 'date', 'category')
    name = 'press_releases'

class DigestListingView(PageListingViewSet):
    menu_label = 'Weekly digests'
    model = DigestPage
    ordering = ['-date']
    list_display = ('title', 'date')
    name = 'weekly_digests'

class TipsForTreasurersListingView(PageListingViewSet):
    menu_label = 'Tips for Treasurers'
    model = TipsForTreasurersPage
    ordering = ['-date']
    list_display = ('title', 'date')
    name = 'tips_for_treasurers'

class RecordListingView(PageListingViewSet):
    menu_label = 'FEC Record'
    model = RecordPage
    ordering = ['-date']
    list_display = ('title', 'date', 'category')
    name = 'fec_record'

class UpdatesViewSetGroup(ViewSetGroup):
    menu_label = 'News and Updates'
    menu_icon = 'globe'
    add_to_admin_menu = True
    menu_order = 100
    items = (PressReleaseListingView, DigestListingView, TipsForTreasurersListingView, RecordListingView)
    name = 'News and Updates'

@hooks.register("register_admin_viewset")
def register_viewset():
    return UpdatesViewSetGroup()
