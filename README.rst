FEC-CMS
+++++++

Install
=======

.. code::

    npm install
    pip install -U -r requirements.txt

Setup
=====

.. code::

    ./fec/manage.py createsuperuser
    ./fec/manage.py makemigrations
    ./fec/manage.py migrate

Local styles
------------

Environment variable: ::

    export FEC_STYLE_URL=http://localhost:8080/css/styles.css

Settings: ::

    FEC_STYLE_URL = 'http://localhost:8080/css/styles.css'

Developing with openFEC
-----------------------

Environment variable: ::

    export FEC_STYLE_URL=http://localhost:3000

Settings: ::

    FEC_APP_URL = 'http://localhost:3000'

Run
===

.. code::
    
    ./fec/manage.py runserver
