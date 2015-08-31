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

    export FEC_STYLE_URL=http://localhost:8080/css/styles.css

Settings: ::

    FEC_STYLE_URL = 'http://localhost:8080/css/styles.css'

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
    cf bind-service cms fec-dev-cms
