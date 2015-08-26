cd fec
gulp build-js
./manage.py collectstatic --settings fec.settings.production --noinput
./manage.py compress --settings fec.settings.production
./manage.py makemigrations --settings fec.settings.production
./manage.py migrate --settings fec.settings.production
gunicorn fec.wsgi:application
