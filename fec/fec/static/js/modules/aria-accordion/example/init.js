'use strict';

var accordion = require('..');

var accordionElement = document.querySelector('.js-accordion');

new accordion.Accordion(accordionElement, {}, {openFirst: true});
