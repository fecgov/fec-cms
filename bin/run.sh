#!/bin/bash

# Set environment options to exit immediately if a non-zero status code
# appears from a command or within a pipe
set -o errexit
set -o pipefail

# Send out Slack notification(s) (off for now)
# invoke notify

# Build static files
cd fec
gulp build-js
./manage.py collectstatic --settings fec.settings.production --noinput
./manage.py compress --settings fec.settings.production

# Run migrations
./manage.py makemigrations --settings fec.settings.production
./manage.py migrate --settings fec.settings.production --noinput

# Run application
gunicorn fec.wsgi:application
