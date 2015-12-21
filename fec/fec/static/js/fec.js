'use strict';

var $ = require('jquery');
var URI = require('urijs');

var terms = require('fec-style/js/terms');
var glossary = require('fec-style/js/glossary');
var accordion = require('fec-style/js/accordion');
var feedback = require('fec-style/js/feedback');
var skipNav = require('fec-style/js/skip-nav');
var siteNav = require('fec-style/js/site-nav');
var FilterPanel = require('fec-style/js/filter-panel').FilterPanel;

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

  // Initialize feedback widget
  new feedback.Feedback(window.FEC_APP_URL + '/issue/');

  // Initialize calendar
  var cal = new calendar.Calendar({
    selector: '#calendar',
    url: URI(window.API_LOCATION)
      .path([window.API_VERSION, 'calendar-dates'].join('/'))
      .query({API_KEY: window.API_KEY})
      .toString(),
    sourceOpts: calendar.fecSources
  });

  // Initialize filters
  var filterPanel = new FilterPanel('#filters');
  filterPanel.$body.find('form').on('change', function() {
    cal.filter(filterPanel.filterSet.serialize());
  });
});
