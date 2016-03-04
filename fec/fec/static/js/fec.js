'use strict';

var $ = require('jquery');

var Glossary = require('@18f/glossary-panel');
var Accordion = require('@18f/accordion').Accordion;

var terms = require('fec-style/js/terms');
var feedback = require('fec-style/js/feedback');
var skipNav = require('fec-style/js/skip-nav');
var siteNav = require('fec-style/js/site-nav');
var dropdown = require('fec-style/js/dropdowns');
var FilterPanel = require('fec-style/js/filter-panel').FilterPanel;
var filterTags = require('fec-style/js/filter-tags');

// Hack: Append jQuery to `window` for use by legacy libraries
window.$ = window.jQuery = $;

var Sticky = require('component-sticky');
var calendar = require('./calendar');
var calendarHelpers = require('./calendar-helpers');
var toc = require('./toc');

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

  // Initialize checkbox dropdowns
  $('.js-dropdown').each(function() {
    new dropdown.Dropdown(this);
  });

  // Initialize feedback widget
  new feedback.Feedback(window.FEC_APP_URL + '/issue/');

  // Initialize filter tags
  var $widgets = $('.js-data-widgets');
  var $tagList = new filterTags.TagList({title: 'All records'}).$body;
  $widgets.prepend($tagList);

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
