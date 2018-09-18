'use strict';

/* global require, ga */

var $ = require('jquery');
var lookup = require('../modules/election-lookup');

var LineChart = require('../modules/line-chart').LineChart;
var ReactionBox = require('../modules/reaction-box').ReactionBox;
var helpers = require('../modules/helpers');
var analytics = require('../modules/analytics');

function Overview(selector, type, index) {
  this.selector = selector;
  this.$element = $(selector);
  this.type = type;
  this.index = index;

  this.totals = this.$element.find('.js-total');

  this.zeroPadTotals();

  $(window).on('resize', this.zeroPadTotals.bind(this));
  if (this.$element.length > 0 && helpers.isInViewport(this.$element)) {
    this.init();
  } else {
    $(window).on('scroll', this.init.bind(this));
  }
}

Overview.prototype.init = function() {
  if (this.initialized) {
    return;
  }
  new LineChart(
    this.selector + ' .js-chart',
    this.selector + ' .js-snapshot',
    this.type,
    this.index
  );
  this.initialized = true;
};

Overview.prototype.zeroPadTotals = function() {
  helpers.zeroPad(
    this.selector + ' .js-snapshot',
    '.snapshot__item-number',
    '.figure__decimals'
  );
};

$(document).ready(function() {
  new Overview('.js-raised-overview', 'raised', 1);
  new Overview('.js-spent-overview', 'spent', 2);
  new lookup.ElectionLookup('#election-lookup', false);
  new ReactionBox('[data-name="raised"][data-location="landing"]');
  new ReactionBox('[data-name="spent"][data-location="landing"]');
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
