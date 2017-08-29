from wagtail.contrib.modeladmin.options import ModelAdmin, modeladmin_register
from wagtail.wagtailcore import hooks

from .models import Author
from search.utils.search_indexing import handle_page_edit_or_create, handle_page_delete

class AuthorAdmin(ModelAdmin):
    model = Author
    menu_icon = 'user'
    menu_order = 200  # will put in 3rd place (000 being 1st, 100 2nd)
    add_to_settings_menu = False  # or True to add your model to the Settings sub-menu
    list_display = ('name', 'title', 'email')
    list_filter = ()
    search_fields = ('name', 'title', 'email')


modeladmin_register(AuthorAdmin)


@hooks.register('after_create_page')
def search_add(request, page):
    handle_page_edit_or_create(page, 'add')


@hooks.register('after_edit_page')
def search_update(request, page):
    handle_page_edit_or_create(page, 'update')


@hooks.register('after_delete_page')
def remove_page(request, page):
    handle_page_delete(page.id)
