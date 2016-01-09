'use strict';

var $ = require('jquery');

var terms = require('fec-style/js/terms');
var glossary = require('fec-style/js/glossary');
var accordion = require('fec-style/js/accordion');
var feedback = require('fec-style/js/feedback');
var skipNav = require('fec-style/js/skip-nav');
var siteNav = require('fec-style/js/site-nav');
var dropdown = require('fec-style/js/dropdowns');
var FilterPanel = require('fec-style/js/filter-panel').FilterPanel;
var filterTags = require('fec-style/js/filter-tags');
var helpers = require('fec-style/js/helpers');

// Hack: Append jQuery to `window` for use by legacy libraries
window.$ = window.jQuery = $;

var Sticky = require('component-sticky');
var calendar = require('./calendar');
var toc = require('./toc');

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

  // Initialize checkbox dropdowns
  $('.js-dropdown').each(function() {
    new dropdown.Dropdown(this);
  });

  // Initialize feedback widget
  new feedback.Feedback(window.FEC_APP_URL + '/issue/');

  // Initialize filters
  var filterPanel = new FilterPanel();

  // Initialize filter tags
  var $widgets = $('.js-data-widgets');
  var $tagList = new filterTags.TagList({title: 'All records'}).$body;
  $widgets.prepend($tagList);

  // Initialize calendar
  new calendar.Calendar({
    selector: '#calendar',
    download: '#calendar-download',
    subscribe: '#calendar-subscribe',
    url: calendar.getUrl(['calendar-dates']),
    exportUrl: calendar.getUrl(['calendar-dates', 'export']),
    filterPanel: filterPanel,
    sourceOpts: calendar.fecSources
  });

});
