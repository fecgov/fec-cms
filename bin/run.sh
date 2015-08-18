cd fec
./manage.py makemigrations --settings fec.settings.production
./manage.py migrate --settings fec.settings.production
gunicorn fec.wsgi:application
