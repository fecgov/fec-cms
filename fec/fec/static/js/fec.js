'use strict';

var $ = require('jquery');

var Accordion = require('aria-accordion').Accordion;
var Glossary = require('glossary-panel');

var terms = require('fec-style/js/terms');
var feedback = require('fec-style/js/feedback');
var skipNav = require('fec-style/js/skip-nav');
var siteNav = require('fec-style/js/site-nav');
var dropdown = require('fec-style/js/dropdowns');
var FilterPanel = require('fec-style/js/filter-panel').FilterPanel;
var filterTags = require('fec-style/js/filter-tags');
var stickyBar = require('fec-style/js/sticky-bar');
var toc = require('fec-style/js/toc');

// Hack: Append jQuery to `window` for use by legacy libraries
window.$ = window.jQuery = $;

var Sticky = require('component-sticky');
var calendar = require('./calendar');
var calendarHelpers = require('./calendar-helpers');

var legal = require('./legal');

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
    var openFirst = $(this).data('open-first') || false;
    var selectors = {
      body: '.js-accordion',
      trigger: '.js-accordion-trigger'
    };
    var opts = {
      contentPrefix: contentPrefix,
      openFirst: openFirst
    };
    new Accordion(selectors, opts);
  });

  new skipNav.Skipnav('.skip-nav', 'main');
  new siteNav.SiteNav('.js-site-nav', {
    cmsUrl: '',
    webAppUrl: window.FEC_APP_URL
  });

  // Initialize table of contents
  new toc.TOC('.js-toc');

  // Initialize sticky elements
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

  // Initialize checkbox dropdowns
  $('.js-dropdown').each(function() {
    new dropdown.Dropdown(this);
  });

  // Initialize feedback widget
  var feedbackWidget = new feedback.Feedback(window.FEC_APP_URL + '/issue/');

  // Initialize legal page
  new legal.Legal(feedbackWidget, '#share-feedback-link', '#ethnio-link');

  // Initialize filter tags
  var $tagList = new filterTags.TagList({
    resultType: 'events',
    emptyText: 'all events',
  }).$body;
  $('.js-filter-tags').prepend($tagList);

  // Initialize filters
  var filterPanel = new FilterPanel();

  // Initialize calendar
  new calendar.Calendar({
    selector: '#calendar',
    download: '#calendar-download',
    subscribe: '#calendar-subscribe',
    url: calendarHelpers.getUrl(['calendar-dates']),
    exportUrl: calendarHelpers.getUrl(['calendar-dates', 'export']),
    filterPanel: filterPanel,
  });
});
