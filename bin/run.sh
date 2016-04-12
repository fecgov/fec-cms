invoke notify

# Build static files
cd fec
gulp build-js
./manage.py collectstatic --settings fec.settings.production --noinput
./manage.py compress --settings fec.settings.production

# Run migrations
./manage.py makemigrations --settings fec.settings.production
./manage.py migrate --settings fec.settings.production

# Run application
gunicorn fec.wsgi:application
