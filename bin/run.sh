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
./manage.py migrate --noinput

# Temporary addition for Wagtail search backend update.
# Only need to run this once for the Wagtail 3 upgrade.
./manage.py update_index

# Run application
gunicorn -k gevent -w 2 fec.wsgi:application
