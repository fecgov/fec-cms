import requests
import json

from django import forms
from django.conf import settings

# ServiceNow credentials
username = settings.FEC_SERVICE_NOW_USERNAME
password = settings.FEC_SERVICE_NOW_PASSWORD
base_url = settings.FEC_SERVICE_NOW_API

class ContactRAD(forms.Form):
    """
    Generates a contact form for submitting questions to RAD
    """
    def __init__(self, *args, **kwargs):
        category_options = [('', 'Choose a subject')] + form_categories()
        super().__init__(*args, **kwargs)

        self.fields['u_contact_first_name'] = forms.CharField(label='First name', max_length=100, required=True)
        self.fields['u_contact_last_name'] = forms.CharField(label='Last name', max_length=100, required=True)
        self.fields['u_contact_email'] = forms.EmailField(label='Email', max_length=100, required=True)
        self.fields['committee_name'] = forms.CharField(label='Committee name or ID', max_length=20, required=True, widget=forms.TextInput(attrs={'class': 'js-contact-typeahead'}))
        self.fields['u_committee'] = forms.CharField(widget=forms.HiddenInput())
        self.fields['u_contact_title'] = forms.CharField(label='Your position or title', max_length=100, required=False)
        self.fields['u_category'] = forms.ChoiceField(label='Subject', choices=category_options, required=False)
        self.fields['u_other_reason'] = forms.CharField(label='Subject', max_length=100, required=False)
        self.fields['u_description'] = forms.CharField(label='Question', max_length=100, widget=forms.Textarea, required=True)
        self.fields['u_committee_member_certification'] = forms.BooleanField(label='I agree', required=True)

    def post_to_service_now(self):
        """
        Process the data and post it to the ServiceNow endpoint
        Returns a status code from the request
        """

        # Remove the committee name from the data
        if self.is_valid() and base_url:
            data = self.cleaned_data
            del data['committee_name']

            # Post to ServiceNow
            post_url = base_url + 'u_imp_rad_response'
            post = requests.post(post_url, data=json.dumps(data), auth=(username, password))
            return post.status_code


def fetch_categories():
    """
    This gets a list of categories from the ServiceNow API, which is the API
    that the form ultimately submits to.
    Returns the result of the response as JSON
    """

    if base_url:
        category_url = base_url + 'sys_choice?table=u_rad_response&element=u_category'
        r = requests.get(category_url, auth=(username, password))
        return r.json()['result']
    else:
        return []


def form_categories():
    """
    Calls the fetch_categories function and processes the results by grabbing
    the value and label from each result item and storing it as a tuple
    which is then used as the choices for the category form field
    """
    raw_categories = fetch_categories()
    categories = []
    for cat in raw_categories:
      if 'value' in cat:
        categories.append((cat['value'], cat['label']))
    return categories
