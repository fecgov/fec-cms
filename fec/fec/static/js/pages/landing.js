'use strict';

/* global require, ga */

var $ = require('jquery');
var lookup = require('../modules/election-lookup');

var LineChart = require('../modules/line-chart').LineChart;
var helpers = require('../modules/helpers');
var analytics = require('fec-style/js/analytics');

function Overview(selector, type, index) {
  this.selector = selector;
  this.$element = $(selector);
  this.type = type;
  this.index = index;

  this.totals = this.$element.find('.js-total');

  this.zeroPadTotals();

  $(window).on('resize', this.zeroPadTotals.bind(this));

  if (helpers.isInViewport(this.$element)) {
    this.init();
  } else {
    $(window).on('scroll', this.init.bind(this));
  }
}

Overview.prototype.init = function() {
  if (this.initialized) { return; }
  new LineChart(this.selector + ' .js-chart', this.selector + ' .js-snapshot', this.type, this.index);
  this.initialized = true;
};

Overview.prototype.zeroPadTotals = function() {
  helpers.zeroPad(this.selector + ' .js-snapshot', '.snapshot__item-number', '.figure__decimals');
};

new Overview('.js-raised-overview', 'raised', 1);
new Overview('.js-spent-overview', 'spent', 2);

$(document).ready(function() {
  new lookup.ElectionLookup('#election-lookup', false);
});

$('.js-ga-event').each(function() {
  var eventName = $(this).data('ga-event');
  $(this).on('click', function() {
    if (analytics.trackerExists()) {
      var gaEventData = {
        eventCategory: 'Misc. events',
        eventAction: eventName,
        eventValue: 1
      };
      ga('nonDAP.send', 'event', gaEventData);
    }
  });
});
