'use strict';

/* global window, document, ANALYTICS, BASE_PATH, CMS_URL */

// Implementing a polyfill for js native WeakMap
// in order to patch functionality in an included library
require('es6-weak-map/implement');

var $ = require('jquery');
var Sticky = require('component-sticky');
var Accordion = require('aria-accordion').Accordion;
var Glossary = require('glossary-panel');
var A11yDialog = require('a11y-dialog');

// Hack: Append jQuery to `window` for use by legacy libraries
window.$ = window.jQuery = $;

var terms = require('./terms');
var dropdown = require('./dropdowns');
var siteNav = require('./site-nav');
var skipNav = require('./skip-nav');
var feedback = require('./feedback');
var typeahead = require('./typeahead');
var analytics = require('./analytics');
var stickyBar = require('./sticky-bar');
var toc = require('./toc');
var Search = require('./search');

// Include vendor scripts
require('./vendor/tablist').init();

var toggle = require('./modules/toggle');
var helpers = require('./modules/helpers');
var download = require('./modules/download');
var CycleSelect = require('./modules/cycle-select').CycleSelect;
var SiteOrientation = require('./site-orientation');

$(document).ready(function() {
  // new site orientation
  new SiteOrientation.SiteOrientation('.js-new-site-orientation');

  $('.js-dropdown').each(function() {
    new dropdown.Dropdown(this);
  });

  $('.js-site-nav').each(function() {
    new siteNav.SiteNav(this, {
      cmsUrl: CMS_URL,
      webAppUrl: BASE_PATH,
      transitionUrl: TRANSITION_URL
    });
  });

  new skipNav.Skipnav('.skip-nav', 'main');

  // Initialize stick side elements
  $('.js-sticky-side').each(function() {
    var container = $(this).data('sticky-container');
    var opts = {
      within: document.getElementById(container)
    };
    new Sticky(this, opts);
  });

  // Initialize sticky bar elements
  $('.js-sticky-bar').each(function() {
    new stickyBar.StickyBar(this);
  });

  // Initialize glossary
  new Glossary(terms, {}, {
    termClass: 'glossary__term accordion__button',
    definitionClass: 'glossary__definition accordion__content'
  });

  // Initialize main search typeahead
  new typeahead.Typeahead('.js-search-input', 'allData', BASE_PATH);

  // Initialize header typeahead
  new typeahead.Typeahead($('.js-site-search'), 'all', BASE_PATH);


  // Initialize feedback
  new feedback.Feedback(helpers.buildAppUrl(['issue']));

  // Initialize new accordions
  $('.js-accordion').each(function() {
    var contentPrefix = $(this).data('content-prefix') || 'accordion';
    var openFirst = $(this).data('open-first');
    var selectors = {
      trigger: '.js-accordion-trigger'
    };
    var opts = {
      contentPrefix: contentPrefix,
      openFirst: openFirst
    };
    new Accordion(this, selectors, opts);
  });

  // Initialize search
  $('.js-search').each(function() {
    new Search($(this));
  });

  // Initialize table of contents
  $('.js-toc').each(function() {
    new toc.TOC(this);
  });

  $('.js-modal').each(function() {
    new A11yDialog(this);
    this.addEventListener('dialog:show', function(e) {
      $('body').css('overflow', 'hidden');
    });
    this.addEventListener('dialog:hide', function(e) {
      $('body').css('overflow', 'scroll');
    });
  });

  // TODO: Restore
  // @if DEBUG
  // var perf = require('./modules/performance');
  // perf.bar();
  // @endif

  if (ANALYTICS) {
    analytics.init();
    analytics.pageView();
  }

  // Initialize cycle selects
  $('.js-cycle').each(function(idx, elm) {
    CycleSelect.build($(elm));
  });

  toggle.init();
  download.hydrate();
});
