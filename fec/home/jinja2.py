from wagtail.contrib.modeladmin.options import ModelAdmin, ModelAdminGroup, modeladmin_register
from wagtail.core import hooks

from .models import Author, PressReleasePage, DigestPage, TipsForTreasurersPage, RecordPage
from search.utils.search_indexing import handle_page_edit_or_create, handle_page_delete


@hooks.register('after_create_page')
def search_add(request, page):
    handle_page_edit_or_create(page, 'add')


@hooks.register('after_edit_page')
def search_update(request, page):
    handle_page_edit_or_create(page, 'update')


@hooks.register('after_delete_page')
def remove_page(request, page):
    handle_page_delete(page.id)

class AuthorAdmin(ModelAdmin):
    model = Author
    menu_icon = 'user'
    menu_order = 300  # will put in 3rd place (000 being 1st, 100 2nd)
    add_to_settings_menu = False  # or True to add your model to the Settings sub-menu
    list_display = ('name', 'title', 'email')
    list_filter = ()
    search_fields = ('name', 'title', 'email')


class PressReleaseModelAdmin(ModelAdmin):
    menu_label = 'Press releases'
    model = PressReleasePage
    ordering = ['-date']
    list_display = ('title', 'date', 'category')


class DigestPageModelAdmin(ModelAdmin):
    menu_label = 'Weekly digests'
    model = DigestPage
    ordering = ['-date']
    list_display = ('title', 'date')


class TipsForTreasurersPageModelAdmin(ModelAdmin):
    menu_label = 'Tips for Treasurers'
    model = TipsForTreasurersPage
    ordering = ['-date']
    list_display = ('title', 'date')


class RecordPageModelAdmin(ModelAdmin):
    menu_label = 'FEC Record'
    model = RecordPage
    ordering = ['-date']
    list_display = ('title', 'date', 'category')


class NewsAndUpdatesAdmin(ModelAdminGroup):
    menu_label = 'News and updates'
    menu_icon = 'folder-open-inverse'
    menu_order = 200
    items = (PressReleaseModelAdmin, DigestPageModelAdmin, TipsForTreasurersPageModelAdmin, RecordPageModelAdmin)

modeladmin_register(AuthorAdmin)
modeladmin_register(NewsAndUpdatesAdmin)
