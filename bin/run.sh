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

# Run application
gunicorn fec.wsgi:application
