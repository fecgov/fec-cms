from wagtail.contrib.modeladmin.options import ModelAdmin, modeladmin_register
from .models import Author


class AuthorAdmin(ModelAdmin):
    model = Author
    menu_icon = 'user'
    menu_order = 200  # will put in 3rd place (000 being 1st, 100 2nd)
    add_to_settings_menu = False  # or True to add your model to the Settings sub-menu
    list_display = ('name', 'title', 'email')
    list_filter = ()
    search_fields = ('name', 'title', 'email')


modeladmin_register(AuthorAdmin)
