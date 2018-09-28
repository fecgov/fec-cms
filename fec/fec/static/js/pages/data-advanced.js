'use strict';

/* global require, ga */

var $ = require('jquery');

var LineChartCommittees = require('../modules/line-chart-committees')
  .LineChartCommittees;
var ReactionBox = require('../modules/reaction-box').ReactionBox;
var tabs = require('../vendor/tablist');

function PlotChart(selector, type, index) {
  this.selector = selector;
  this.$element = $(selector);
  this.type = type;
  this.index = index;
  this.initialized = false;
  this.totals = this.$element.find('.js-total');
}

PlotChart.prototype.init = function() {
  if (this.initialized) {
    return;
  }
  new LineChartCommittees(
    this.selector + ' .js-chart',
    '.js-' + this.type + '-snapshot',
    this.type,
    this.index
  );
  this.initialized = true;
};

window.reactionBoxes = {};

window.submitReactionspent = function(token) {
  window.reactionBoxes['spent'].handleSubmit(token);
}

window.submitReactionraised = function(token) {
  window.reactionBoxes['raised'].handleSubmit(token);
}

$(document).ready(function() {
  tabs.onShow($('#raising'), function() {
    new PlotChart('.js-raised-overview', 'raised', 1).init();
    window.reactionBoxes['raised'] = new ReactionBox('[data-name="raised"][data-location="advanced"]');
  });

  tabs.onShow($('#spending'), function() {
    new PlotChart('.js-spent-overview', 'spent', 2).init();
    window.reactionBoxes['spent'] = new ReactionBox('[data-name="spent"][data-location="advanced"]');
  });
});
