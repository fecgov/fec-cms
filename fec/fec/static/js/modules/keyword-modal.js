'use strict';

var $ = require('jquery');

function KeywordModal() {
  this.$elm = $('.js-keyword-modal');
  this.$form = this.$elm.find('form');
  this.$inputs = this.$elm.find('input[type="text"]');
  this.$combinedValue = this.$elm.find('input[type="hidden"]');
  this.$submit = this.$elm.find('button[type="submit"]');
  this.$submit.on('click', this.handleSubmit.bind(this));
}

KeywordModal.prototype.handleSubmit = function(e) {
  e.preventDefault();
  var query = this.combineFields();
  this.$combinedValue.value = query;
  // this.$form.submit();
};

KeywordModal.prototype.combineFields = function() {
  var query = '';
  var self = this;
  this.$inputs.each(function() {
    if (this.value) {
      var joiner = this.dataset.operator === 'exclude' ? '&' : '+';
      query = query + joiner + '(' + self.parseValue(this) + ')';
    }
  });

  return query;
};

KeywordModal.prototype.parseValue = function(input) {
  var words = input.value.split(' ');
  if (input.dataset.operator === 'and') {
    return words.join('&');
  } else if (input.dataset.operator === 'or') {
    return words.join('+');
  } else if (input.dataset.operator === 'exact') {
    return '"' + input.value + '"';
  } else if (input.dataset.operator === 'exclude') {
    return words.join('-');
  }
};

module.exports = { KeywordModal: KeywordModal };
