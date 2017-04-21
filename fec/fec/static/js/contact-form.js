'use strict';

var $ = require('jquery');
var Typeahead = require('fec-style/js/typeahead').Typeahead;

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

new ContactForm($('.js-contact-form'));

// Even though we initialize above, export so it can be tested
module.exports = {ContactForm: ContactForm};
