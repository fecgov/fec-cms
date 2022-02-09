'use strict';

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

var terms = require('./data/terms');
var dropdown = require('./modules/dropdowns');
var siteNav = require('./modules/site-nav');
var skipNav = require('./modules/skip-nav');
var feedback = require('./modules/feedback');
import { AutoSuggest } from './modules/autosuggest';
var toc = require('./modules/toc');
var Search = require('./modules/search');

// Include vendor scripts
require('./vendor/tablist').init();

var toggle = require('./modules/toggle');
var helpers = require('./modules/helpers');
var download = require('./modules/download');
var CycleSelect = require('./modules/cycle-select').CycleSelect;

// This is the jQuery.ready(), which has been deprecated
$(function() {
  $('.js-dropdown').each(function() {
    new dropdown.Dropdown(this);
  });

  new siteNav.SiteNav('.js-site-nav');

  new skipNav.Skipnav('.skip-nav', 'main');

  // Initialize stick side elements
  $('.js-sticky-side').each(function() {
    var container = $(this).data('sticky-container');
    var opts = {
      within: document.getElementById(container)
    };
    new Sticky(this, opts);
  });

  // Initialize glossary
  new Glossary(
    terms,
    {},
    {
      termClass: 'glossary__term accordion__button',
      definitionClass: 'glossary__definition accordion__content'
    }
  );

  // Until we can re-configure the modal windows used with the filters panel,
  // let's re-parent #version-methodology-modal_processed and
  // #version-methodology-modal_raw to <body> so their positioning
  // aren't stuck inside the rules for .filters__content (position: relative, top: 0, left: 0)
  $('#version-methodology-modal_processed, #version-methodology-modal_raw')
    .detach()
    .appendTo('body');

  // initialize a feedbackWidget which will be set after document is loaded.
  var feedbackWidget = null;
  // expose a global function for Recaptcha to invoke after the challenge is complete.
  window.submitFeedback = function(token) {
    feedbackWidget.submit(token);
  };

  // Initialize main search autosearch
  let mainSearchElement = document.querySelector('.js-search-input');
  console.log('mainSearchElement: ', mainSearchElement);
  if (mainSearchElement) new AutoSuggest(mainSearchElement, 'allData', '/data/');

  // Initialize header autosearch
  let siteSearchElement = document.querySelector('.js-site-search');
  if (siteSearchElement) new AutoSuggest(siteSearchElement, 'all', '/data/');

  // Initialize feedback
  feedbackWidget = new feedback.Feedback(helpers.buildAppUrl(['issue']));

  // Initialize new accordions
  $('.js-accordion').each(function() {
    var contentPrefix = $(this).data('content-prefix') || 'accordion';
    var openFirst = $(this).data('open-first');
    var selectors = {
      trigger: '.js-accordion-trigger'
    };
    var opts = {
      contentPrefix: contentPrefix,
      openFirst: openFirst,
      collapseOthers:
        window.location.href.indexOf('president/presidential-map') > 0
          ? true
          : false,
      customHiding:
        window.location.href.indexOf('president/presidential-map') > 0
          ? true
          : false
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

  // Initialize cycle selects
  $('.js-cycle').each(function(idx, elm) {
    CycleSelect.build($(elm));
  });

  toggle.init();
  download.hydrate();
});
