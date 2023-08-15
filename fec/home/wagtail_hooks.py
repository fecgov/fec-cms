from wagtail.contrib.modeladmin.options import ModelAdmin, ModelAdminGroup, modeladmin_register

from .models import Author, PressReleasePage, DigestPage, TipsForTreasurersPage, RecordPage


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
