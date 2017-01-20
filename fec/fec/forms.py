from django import forms
import requests
from django.conf import settings

class ContactRAD(forms.Form):
  url = settings.FEC_SERVICE_NOW_API + 'sys_choice?table=u_rad_response&element=u_category'
  username = settings.FEC_SERVICE_NOW_USERNAME
  password = settings.FEC_SERVICE_NOW_PASSWORD

  # Get the category list from ServiceNow to generate the select list
  r = requests.get(url, auth=(username, password))
  raw_categories = r.json()['result']

  # Turn it into a list of tuples to be used as choices
  categories = []
  for cat in raw_categories:
    if 'value' in cat:
      categories.append((cat['value'], cat['label']))

  u_committee = forms.CharField(label='Committee ID', max_length=20, required=True)
  u_contact_first_name = forms.CharField(label='First name', max_length=100, required=True)
  u_contact_last_name = forms.CharField(label='Last name', max_length=100, required=True)
  u_contact_title = forms.CharField(label='Title (optional)', max_length=100)
  u_contact_email = forms.EmailField(label='Email', max_length=100, required=True)
  u_category = forms.ChoiceField(label='Category', choices=categories, required=True)
  u_description = forms.CharField(label='Question', max_length=100, widget=forms.Textarea, required=True)
  u_committee_member_certification = forms.BooleanField(label='I agree', required=True)
