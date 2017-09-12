from wagtail.wagtailcore import hooks
import logging

logger = logging.getLogger('fec')

'''
These are some initial hooks, they can be improved.  Maybe add logic to sense
what is changed when a user is modified?  For now user addition, deletion, and
modification is logged (the user modified and the user initiating the change both logged)
'''
@hooks.register('after_create_user')
def log_user_creation(request, user):
    logger.info("User {0} created by {1}".format(user, request.user))

@hooks.register('after_delete_user')
def log_user_deletion(request, user):
    logger.info("User {0} deleted by {1}".format(user, request.user))

@hooks.register('after_modify_user')
def log_user_modification(request, user):
    logger.info("User {0} modified by {1}".format(user, request.user))
