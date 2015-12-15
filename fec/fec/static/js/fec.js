'use strict';

/* global require, window, document */

var $ = require('jquery');

var terms = require('fec-style/js/terms');
var glossary = require('fec-style/js/glossary');
var accordion = require('fec-style/js/accordion');
var feedback = require('fec-style/js/feedback');
var skipNav = require('fec-style/js/skip-nav');
var siteNav = require('fec-style/js/site-nav');

// Hack: Append jQuery to `window` for use by legacy libraries
window.$ = window.jQuery = $;

var Sticky = require('component-sticky');
var toc = require('./toc.js');

var SLT_ACCORDION = '.js-accordion';

$(document).ready(function() {
  // Initialize glossary
  new glossary.Glossary(terms, {body: '#glossary'});
  new skipNav.Skipnav('.skip-nav', 'main');
  new siteNav.SiteNav('.js-site-nav');

  // Initialize accordions
  $(SLT_ACCORDION).each(function() {
    Object.create(accordion).init($(this));
  });

  // Initialize table of contents
  new toc.TOC('.js-toc');

  // Initialize sticky elements
  $('.js-sticky').each(function() {
    var container = $(this).data('sticky-container');
    var opts = {
      within: document.getElementById(container)
    };
    new Sticky(this, opts);
  });

  new feedback.Feedback(window.FEC_APP_URL + '/issue/');
});
