'use strict';

/* global require, window, document */

var $ = require('jquery');

var Glossary = require('@18f/glossary-panel');
var Accordion = require('@18f/accordion').Accordion;

var terms = require('fec-style/js/terms');
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
  // Initialize glossary
  new Glossary(terms, {}, {
    termClass: 'glossary__term accordion__button',
    definitionClass: 'glossary__definition accordion__content'
  });

  // Initialize new accordions
  $('.js-accordion').each(function(){
    var contentPrefix = $(this).data('content-prefix') || 'accordion';
    var selectors = {
      body: '.js-accordion',
      trigger: '.js-accordion-trigger'
    };
    var opts = {
      contentPrefix: contentPrefix,
    };
    new Accordion(selectors, opts);
  });

  new skipNav.Skipnav('.skip-nav', 'main');
  new siteNav.SiteNav('.js-site-nav');

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
