'use strict';

var $ = require('jquery');
var URI = require('urijs');
var A11yDialog = require('a11y-dialog');

/**
 * KeywordModal
 * @class
 * Creates a pop-up modal for advanced keyword searches
 * and processes the values of the various inputs to form a single search string
 * with all the proper boolean operators
 * In the web app, it loads results by simply adding the new search query
 * to the window.location.search which forces a page refresh.
 */
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

/**
 * Handle a click event on the submit button
 * prevents the form from being submitted at first in order to create the search string
 * and then replaces the existing search param in the window.
 * Hides the modal after executed.
 */
KeywordModal.prototype.handleSubmit = function(e) {
  e.preventDefault();
  var combinedValue = this.combineFields();
  var query = URI(window.location.search)
    .removeSearch('search')
    .addSearch('search', combinedValue);
  window.location.search = query.toString();
  this.dialog.hide();
};

/**
 * Combine the values of all the inputs into a single formatted string
 * It first goes through the first three inputs and joins them with "or" operators
 * If there's an exclude value, it wraps the previous query in parens
 * and adds the exclude value with an ampersand
 * @return {string} The combined query
 */
KeywordModal.prototype.combineFields = function() {
  var query = '';
  var self = this;

  this.$fields.each(function() {
    var $input = $(this);
    if ($input.val() && query) {
      query = query + '+' + '(' + self.parseValue($input) + ')';
    } else if ($input.val()) {
      query = '(' + self.parseValue($input) + ')';
    }
  });

  if (this.$excludeField.val() && query) {
    query = '(' + query + ')&(' + self.parseValue(this.$excludeField) + ')';
  } else if (this.$excludeField.val()) {
    query = self.parseValue(this.$excludeField);
  }

  return query;
};

/**
 * Parses the values of the individual input, combining the words with
 * whichever operator the input requires, as determined by its data-operator attr
 * @returns {string} The various words joined together with the correct operator
 */
KeywordModal.prototype.parseValue = function($input) {
  var words = $input.val().split(' ');
  var operator = $input.data('operator');
  if (operator === 'and') {
    return words.join('&');
  } else if (operator === 'or') {
    return words.join('OR');
  } else if (operator === 'exact') {
    return '"' + $input.val() + '"';
  } else if (operator === 'exclude') {
    return '-' + words.join('-');
  }
};

module.exports = { KeywordModal: KeywordModal };
