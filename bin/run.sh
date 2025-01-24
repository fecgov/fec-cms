#!/bin/bash

# Set environment options to exit immediately if a non-zero status code
# appears from a command or within a pipe
set -o errexit
set -o pipefail

cd fec
# Run migrations
./manage.py makemigrations
./manage.py migrate --noinput

# Run application
gunicorn -k gthread --threads 2 -w 4 fec.wsgi:application
