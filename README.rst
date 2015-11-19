
Campaign finance for everyone
=============================
The Federal Election Commission (FEC) releases information to the public about money that’s raised and spent in federal elections — that’s elections for US president, Senate, and House of Representatives. 

Are you interested in seeing how much money a candidate raised? Or spent? How much debt they took on? Who contributed to their campaign? The FEC is the authoritative source for that information.

betaFEC is a collaboration between `18F <http://18f.gsa.gov>`_ and the FEC. It aims to make campaign finance information more accessible (and understandable) to all users. 

FEC repositories 
================
We welcome you to explore, make suggestions, and contribute to our code. 

This repository, `fec-cms <https://github.com/18F/fec-cms>`_: the content management system (CMS) for betaFEC.

All repositories
-----------------
- `FEC <https://github.com/18F/fec>`_: a general discussion forum. We compile `feedback <https://github.com/18F/fec/issues>`_ from betaFEC’s feedback widget here, and this is the best place to submit general feedback.
- `openFEC <https://github.com/18F/openfec>`_: betaFEC’s API
- `openFEC-web-app <https://github.com/18f/openfec-web-app>`_: the betaFEC web app for exploring campaign finance data
- `fec-style <https://github.com/18F/fec-style>`_: shared styles and user interface components
- `fec-cms <https://github.com/18F/fec-cms>`_: the content management system (CMS) for betaFEC. This project uses `Wagtail <https://github.com/torchbox/wagtail>`_, an open source CMS written in Python and built on the Django framework.

Get involved
================
We’re thrilled you want to get involved! 
- Read our contributing `guidelines <https://github.com/18F/openfec/blob/master/CONTRIBUTING.md>`_. Then, file an `issue <https://github.com/18F/fec/issues>`_ or submit a pull request.
- Send us an email at betafeedback@fec.gov. 
- If you’re a developer, follow the installation instructions in the README.md page of each repository to run the apps on your computer. 
- Check out our StoriesonBoard `FEC story map <https://18f.storiesonboard.com/m/fec>`_ to get a sense of the user needs we'll be addressing in the future.


Set up
============

Installation
-----------------

Install PostgreSQL.

On Mac OS: ::

    brew install postgres

On Ubuntu: ::

    apt-get install postgres

Install dependencies: ::

    npm install
    npm install -g gulp
    pip install -U -r requirements.txt

Set up
-----------------

.. code::

    cd fec
    gulp build-js
    ./manage.py createsuperuser
    ./manage.py makemigrations
    ./manage.py migrate

Local styles
~~~~~~~~~~~~~~~~~~~~~~

Environment variable: ::

    export FEC_WEB_STYLE_URL=http://localhost:8080/css/styles.css

Settings: ::

    FEC_WEB_STYLE_URL = 'http://localhost:8080/css/styles.css'

Developing with openFEC
~~~~~~~~~~~~~~~~~~~~~~

Environment variable: ::

    export FEC_APP_URL=http://localhost:3000

Settings: ::

    FEC_APP_URL = 'http://localhost:3000'

Run
-----------------

.. code::
    
    ./manage.py runserver

Deploy
-----------------

Provision development database: ::

    cf create-service rds shared-psql fec-dev-cms

Provision credentials service: ::

    cf cups cms-creds-dev -p '{"DJANGO_SECRET_KEY": "..."}'

Install `autopilot`: ::

    go get github.com/concourse/autopilot
    cf install-plugin $GOPATH/bin/autopilot

Deploy: ::

    cf zero-downtime-push cms -f manifest.yml


Copyright and licensing
=======================
This project is in the public domain within the United States, and we waive worldwide copyright and related rights through `CC0 universal public domain dedication <https://creativecommons.org/publicdomain/zero/1.0/>`_. Read more on our license page.

A few restrictions limit the way you can use FEC data. For example, you can’t use contributor lists for commercial purposes or to solicit donations. Learn more on FEC.gov.
