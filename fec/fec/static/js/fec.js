'use strict';

/* global require, window, document */

var $ = require('jquery');

var glossary = require('fec-style/js/glossary');
var accordion = require('fec-style/js/accordion');

// // Hack: Append jQuery to `window` for use by legacy libraries
// window.$ = window.jQuery = $;

var SLT_ACCORDION = '.js-accordion';

$(document).ready(function() {
    // Initialize glossary
    new glossary.Glossary('#glossary', '#glossary-toggle');

    // Initialize accordions
    $(SLT_ACCORDION).each(function() {
      Object.create(accordion).init($(this));
    });
});
