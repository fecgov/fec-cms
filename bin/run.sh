#!/bin/bash

# Set environment options to exit immediately if a non-zero status code
# appears from a command or within a pipe
set -o errexit
set -o pipefail

# Send out Slack notifications (off for now)
# invoke notify

cd fec
# Run migrations
./manage.py makemigrations
./manage.py migrate wagtailadmin
./manage.py migrate wagtailcore
./manage.py migrate wagtaildocs
./manage.py migrate wagtailembeds
./manage.py migrate wagtailforms
./manage.py migrate wagtailimages
./manage.py migrate wagtailredirects
./manage.py migrate wagtailsearch
./manage.py migrate wagtailsearchpromotions
./manage.py migrate wagtailusers
./manage.py migrate --fake home

# Run application
gunicorn -k gevent -w 2 fec.wsgi:application
