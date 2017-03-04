from django import forms
import requests
from django.conf import settings

def fetch_categories():
    """
    This gets a list of categories from the ServiceNow API, which is the API
    that the form ultimately submits to.

    Returns the result of the response as JSON
    """
    url = settings.FEC_SERVICE_NOW_API + 'sys_choice?table=u_rad_response&element=u_category'
    username = settings.FEC_SERVICE_NOW_USERNAME
    password = settings.FEC_SERVICE_NOW_PASSWORD

    # Get the category list from ServiceNow to generate the select list
    r = requests.get(url, auth=(username, password))
    return r.json()['result']

def form_categories():
    """
    Calls the fetch_categories function and processes the results by grabbing
    the value and label from each result item and storing it as a tuple
    which is then used as the choices for the category form field
    """
    raw_categories = fetch_categories()
    # Turn it into a list of tuples to be used as choices
    categories = [('', 'Choose a subject')]
    for cat in raw_categories:
      if 'value' in cat:
        categories.append((cat['value'], cat['label']))
    return categories

class ContactRAD(forms.Form):
    if settings.FEC_SERVICE_NOW_API:
        categories = form_categories()
        u_contact_first_name = forms.CharField(label='First name', max_length=100, required=True)
        u_contact_last_name = forms.CharField(label='Last name', max_length=100, required=True)
        u_contact_email = forms.EmailField(label='Email', max_length=100, required=True)
        committee_name = forms.CharField(label='Committee name or ID', max_length=20, required=True,
                                      widget=forms.TextInput(attrs={'class': 'js-contact-typeahead'}))
        u_committee = forms.CharField(widget=forms.HiddenInput())
        u_contact_title = forms.CharField(label='Your position or title', max_length=100, required=False)
        u_category = forms.ChoiceField(label='Subject', choices=categories, required=True)
        u_other_reason = forms.CharField(label='Subject', max_length=100, required=False)
        u_description = forms.CharField(label='Question', max_length=100, widget=forms.Textarea, required=True)
        u_committee_member_certification = forms.BooleanField(label='I agree', required=True)
