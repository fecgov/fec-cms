'use strict';

var $ = require('jquery');
var helpers = require('./helpers');

function TopList(selector, dataType) {
  this.$element = $(selector);
  this.$topRaising = this.$element.find('.js-top-raising');
  this.$topSpending = this.$element.find('.js-top-spending');
  this.$toggles = this.$element.find('button');
  this.$topType = this.$element.find('.js-top-type');
  this.raisingID = this.$topRaising.attr('id');
  this.spendingID = this.$topSpending.attr('id');
  this.$visibleList = this.$topRaising;
  this.dataType = dataType;
  this.setAria();
  this.zeroPad();

  this.$toggles.on('click', this.handleToggle.bind(this));
  $(window).on('resize', this.zeroPad.bind(this));
}

TopList.prototype.zeroPad = function() {
  helpers.zeroPad(this.$visibleList, '.figure__number', '.figure__decimals');
};

TopList.prototype.handleToggle = function(e) {
  var $target = $(e.target);
  this.$toggles.removeClass('is-active');
  $target.addClass('is-active');
  if ($target.attr('aria-controls') === this.spendingID) {
    this.showSpending();
  } else {
    this.showRaising();
  }
};

TopList.prototype.setAria = function() {
  this.$topRaising.attr('aria-hidden', 'false');
  this.$topSpending.attr('aria-hidden', 'true');
};

TopList.prototype.showRaising = function() {
  this.$topRaising.attr('aria-hidden', 'false');
  this.$topSpending.attr('aria-hidden', 'true');
  this.$topType.text('raising');
  this.$visibleList = this.$topRaising;
};

TopList.prototype.showSpending = function() {
  this.$topSpending.attr('aria-hidden', 'false');
  this.$topRaising.attr('aria-hidden', 'true');
  this.$topType.text('spending');
  this.$visibleList = this.$topSpending;
  this.zeroPad();
};


module.exports = {
  TopList: TopList
};
