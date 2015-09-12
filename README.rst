FEC-CMS
+++++++

Install
=======

.. code::

    npm install
    npm install -g gulp
    pip install -U -r requirements.txt

Setup
=====

.. code::

    cd fec
    gulp build-js
    ./manage.py createsuperuser
    ./manage.py makemigrations
    ./manage.py migrate

Local styles
------------

Environment variable: ::

    export FEC_WEB_STYLE_URL=http://localhost:8080/css/styles.css

Settings: ::

    FEC_WEB_STYLE_URL = 'http://localhost:8080/css/styles.css'

Developing with openFEC
-----------------------

Environment variable: ::

    export FEC_APP_URL=http://localhost:3000

Settings: ::

    FEC_APP_URL = 'http://localhost:3000'

Run
===

.. code::
    
    ./manage.py runserver

Deploy
======

Provision development database: ::

    cf create-service rds shared-psql fec-dev-cms

Provision credentials service: ::

    cf cups cms-creds-dev -p '{"DJANGO_SECRET_KEY": "..."}'

Install `autopilot`: ::

    go get github.com/concourse/autopilot
    cf install-plugin $GOPATH/bin/autopilot

Deploy: ::

    cf zero-downtime-push cms -f manifest.yml
