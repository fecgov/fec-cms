'use strict';

/* global require, module */

var $ = require('jquery');
var URI = require('urijs');

var helpers = require('./helpers');

function buildUrl(opts) {
  var parts = ['elections', opts.office, opts.state, opts.district, opts.cycle]
    .filter(function(part) {
      return !!part;
    })
    .concat('')
    .join('/');
  return URI(parts).toString();
}

function ElectionSummary(selector, opts) {
  this.$elm = $(selector);
  this.opts = opts;

  this.$receipts = this.$elm.find('.js-receipts');
  this.$disbursements = this.$elm.find('.js-disbursements');
  this.$expenditures = this.$elm.find('.js-expenditures');

  this.fetch();
  this.$elm.find('.js-election-url').attr('href', buildUrl(this.opts));
}

ElectionSummary.prototype.fetch = function() {
  var url = helpers.buildUrl(['elections', 'summary'], this.opts);
  $.getJSON(url).done(this.draw.bind(this));
};

ElectionSummary.prototype.draw = function(response) {
  this.$receipts.text(helpers.currency(response.receipts));
  this.$disbursements.text(helpers.currency(response.disbursements));
  this.$expenditures.text(helpers.currency(response.independent_expenditures));
};

module.exports = { ElectionSummary: ElectionSummary };
