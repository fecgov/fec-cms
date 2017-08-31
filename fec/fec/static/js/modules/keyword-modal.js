'use strict';

var $ = require('jquery');
var URI = require('urijs');
var A11yDialog = require('a11y-dialog');

function KeywordModal() {
  this.elm = document.querySelector('.js-keyword-modal');
  this.$elm = $(this.elm);
  this.$form = this.$elm.find('form');
  this.$fields = this.$elm.find('#keywords-any, #keywords-all, #keywords-exact');
  this.$excludeField = this.$elm.find('#keywords-none');
  this.$submit = this.$elm.find('button[type="submit"]');
  this.$submit.on('click', this.handleSubmit.bind(this));

  this.dialog = new A11yDialog(this.elm);

  this.$elm.on('dialog:show', function() {
    $('body').css('overflow', 'hidden');
  });

  this.$elm.on('dialog:hide', function() {
    $('body').css('overflow', 'scroll');
  });
}

KeywordModal.prototype.handleSubmit = function(e) {
  e.preventDefault();
  var combinedValue = this.combineFields();
  var query = URI(window.location.search)
    .removeSearch('search')
    .addSearch('search', combinedValue);
  window.location.search = query.toString();
  this.dialog.hide();
};

KeywordModal.prototype.combineFields = function() {
  var query = '';
  var self = this;

  // Add all values from the first three fields, joined by plus-signs
  this.$fields.each(function() {
    var $input = $(this);
    if ($input.val() && query) {
      query = query + '+' + '(' + self.parseValue($input) + ')';
    } else if ($input.val()) {
      query = '(' + self.parseValue($input) + ')';
    }
  });

  // If there's a value in the exclude field, wrap the previous query in ()
  // and add the value with an ampersand
  if (this.$excludeField.val() && query) {
    query = '(' + query + ')&(' + self.parseValue(this.$excludeField) + ')';
  } else if (this.$excludeField.val()) {
    query = self.parseValue(this.$excludeField);
  }

  return query;
};

KeywordModal.prototype.parseValue = function($input) {
  var words = $input.val().split(' ');
  var operator = $input.data('operator');
  if (operator === 'and') {
    return words.join('&');
  } else if (operator === 'or') {
    return words.join('+');
  } else if (operator === 'exact') {
    return '"' + $input.val() + '"';
  } else if (operator === 'exclude') {
    return '-' + words.join('-');
  }
};

module.exports = { KeywordModal: KeywordModal };
