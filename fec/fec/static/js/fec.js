'use strict';

/* global require, window, document */

var $ = require('jquery');

var terms = require('fec-style/js/terms');
var glossary = require('fec-style/js/glossary');
var accordion = require('fec-style/js/accordion');
var skipNav = require('fec-style/js/skip-nav');

// Hack: Append jQuery to `window` for use by legacy libraries
window.$ = window.jQuery = $;

var SLT_ACCORDION = '.js-accordion';

$(document).ready(function() {
    // Initialize glossary
    new glossary.Glossary(terms, {body: '#glossary'});
    new skipNav.Skipnav('.skip-nav', 'main');
    
    // Initialize accordions
    $(SLT_ACCORDION).each(function() {
      Object.create(accordion).init($(this));
    });
});
