'use strict';

/* global window */

var $ = require('jquery');
var Typeahead = require('../modules/typeahead').Typeahead;
var URI = require('urijs');

/* ServiceNow contact form */
function ContactForm($elm) {
  this.$elm = $elm;
  this.committeeId = $elm.find('#id_u_committee');
  this.category = $elm.find('#id_u_category');
  this.otherReason = $elm.find('#id_u_other_reason').closest('div');
  this.typeahead = new Typeahead($elm.find('.js-contact-typeahead'), 'committees', '');
  this.$cancel = $elm.find('.js-cancel');
  this.initTypeahead();
  this.initOtherReason();
  this.category.on('change', this.toggleOtherReason.bind(this));
  this.$cancel.on('click', this.clearForm.bind(this));

  this.$submit = $elm.find('.js-submit');
  this.$submit.on('click', function(e) {
    e.preventDefault();
    grecaptcha.execute();
  });
}

ContactForm.prototype.initTypeahead = function() {
  // Overriding default typeahead behavior
  // This will set the value of a hidden input when selecting a value from typeahead
  var self = this;
  this.typeahead.$element.css({'height': 'auto'});
  this.typeahead.$input.off('typeahead:select');
  this.typeahead.$input.on('typeahead:select', function(e, opts) {
    self.committeeId.val(opts.id);
  });
};

ContactForm.prototype.initOtherReason = function() {
  this.otherReason.addClass('conditional-field');
  this.otherReason.hide();
};

ContactForm.prototype.toggleOtherReason = function(e) {
  if (e.target.value === 'other') {
    this.otherReason.show();
  } else {
    this.otherReason.hide();
  }
};

ContactForm.prototype.clearForm = function(e) {
  e.preventDefault();
  this.$elm.find('input, textarea, select').each(function() {
    $(this).val('');
  });
};

/* Analyst lookup tool */
function AnalystLookup($elm) {
  this.$elm = $elm;
  this.$input = this.$elm.find('input');
  this.$name = this.$elm.find('.js-analyst-name');
  this.$analystContainer = this.$elm.find('.js-analyst-container');
  this.$prompt = this.$elm.find('.js-analyst-prompt');
  this.$ext = this.$elm.find('.js-analyst-ext');
  this.$analystDetails = this.$elm.find('.js-yes-analyst');
  this.$analystNoResults = this.$elm.find('.js-no-analyst');

  this.typeahead = new Typeahead(this.$input, 'committees', '');
  this.initTypeahead();

  this.$input.on('change, blur', this.handleChange.bind(this));
}

AnalystLookup.prototype.initTypeahead = function() {
  // Overriding default typeahead behavior
  this.typeahead.$element.css({'height': 'auto'});
  this.typeahead.$input.off('typeahead:select');
  this.typeahead.$input.on('typeahead:select', this.fetchAnalyst.bind(this));
};

AnalystLookup.prototype.fetchAnalyst = function(e, opts) {
  var url = URI(window.API_LOCATION)
      .path(Array.prototype.concat(window.API_VERSION, 'rad-analyst').join('/'))
      .addQuery({
        api_key: window.API_KEY,
        per_page: 1,
        committee_id: opts.id
      })
      .toString();

  $.getJSON(url).done(this.showAnalyst.bind(this));
};

AnalystLookup.prototype.showAnalyst = function(response) {
  var hasResults = response.results.length > 0;
  if (hasResults) {
    var name = response.results[0].first_name + ' ' + response.results[0].last_name;
    var ext = response.results[0].telephone_ext;
    this.$name.html(name);
    this.$ext.html(ext);
  } 
  this.$analystContainer.attr('aria-hidden', 'false');
  this.$prompt.attr('aria-hidden', 'true');
  this.$analystDetails.attr('aria-hidden', !hasResults);
  this.$analystNoResults.attr('aria-hidden', hasResults);
};

AnalystLookup.prototype.hideAnalyst = function() {
  this.$name.empty();
  this.$ext.empty();
  this.$analystContainer.attr('aria-hidden', 'true');
  this.$analystDetails.attr('aria-hidden', 'true');
  this.$analystNoResults.attr('aria-hidden', 'true');
  this.$prompt.attr('aria-hidden', 'false');
};

AnalystLookup.prototype.handleChange = function(e) {
  if (!$(e.target).val()) {
    this.hideAnalyst();
  }
};

new ContactForm($('.js-contact-form'));
new AnalystLookup($('.js-analyst-lookup'));

// Even though we initialize above, export so it can be tested
module.exports = {
  AnalystLookup: AnalystLookup,
  ContactForm: ContactForm
};