import { default as URI } from 'urijs';

import { buildUrl, currency } from './helpers.js';

function buildElectionSummaryUrl(opts) {
  var parts = ['elections', opts.office, opts.state, opts.district, opts.cycle]
    .filter(function(part) {
      return !!part;
    })
    .concat('')
    .join('/');
  return URI(parts).toString();
}

export default function ElectionSummary(selector, opts) {
  this.$elm = $(selector);
  this.opts = opts;

  this.$receipts = this.$elm.find('.js-receipts');
  this.$disbursements = this.$elm.find('.js-disbursements');
  this.$expenditures = this.$elm.find('.js-expenditures');

  this.fetch();
  this.$elm.find('.js-election-url').attr('href', buildElectionSummaryUrl(this.opts));
}

ElectionSummary.prototype.fetch = function() {
  var url = buildUrl(['elections', 'summary'], this.opts);
  $.getJSON(url).done(this.draw.bind(this));
};

ElectionSummary.prototype.draw = function(response) {
  this.$receipts.text(currency(response.receipts));
  this.$disbursements.text(currency(response.disbursements));
  this.$expenditures.text(currency(response.independent_expenditures));
};
