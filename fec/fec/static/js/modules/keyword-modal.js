import { default as A11yDialog } from 'a11y-dialog';
import { default as URI } from 'urijs';

import { customEvent } from './analytics.js';

/**
 * KeywordModal
 * @class
 * Creates a pop-up modal for advanced keyword searches
 * and processes the values of the various inputs to form a single search string
 * with all the proper boolean operators.
 * In the web app, it loads results by simply adding the new search query
 * to the window.location.search which forces a page refresh.
 */
export default function KeywordModal() {
  this.elm = document.querySelector('.js-keyword-modal');
  this.$elm = $(this.elm);
  this.$form = this.$elm.find('form');
  this.$fields = this.$elm.find(
    '#keywords-any, #keywords-all, #keywords-exact'
  );
  this.$excludeField = this.$elm.find('#keywords-none');
  this.$submit = this.$elm.find('button[type="submit"]');
  this.$submit.on('click', this.handleSubmit.bind(this));

  this.dialog = new A11yDialog(this.elm);

  this.$elm.on(
    'dialog:show',
    function() {
      $('body').css('overflow', 'hidden');
      this.fireEvent('Keyword modal: opened');
    }.bind(this)
  );

  this.$elm.on('dialog:hide', function() {
    $('body').css('overflow', 'scroll');
  });
}

/**
 * Handle a click event on the submit button
 * prevents the form from being submitted at first in order to create the search string
 * and then replaces the existing search param in the window.
 * Hides the modal after execution.
 */
KeywordModal.prototype.handleSubmit = function(e) {
  e.preventDefault();
  const { combinedQuery, excludeQuery } = this.combineFields();
  let query = URI(window.location.search)
    .removeSearch('search')
    .addSearch('search', combinedQuery)
    .removeSearch('search_exclude')
    .addSearch('search_exclude', excludeQuery);

  this.dialog.hide();
  // Event record for GTM
  this.fireEvent('Keyword modal query: ' + combinedQuery + 'Exclude: ' + excludeQuery);
  window.location = this.$form.attr('action') + query.toString();
};

/**
 * Combine the values of all the inputs into separate formatted strings for the main query and the exclude query.
 * @return {Object} The combined query object containing main and exclude queries
 */
KeywordModal.prototype.combineFields = function() {
  let combinedQuery = '';
  let excludeQuery = '';
  const self = this;

  this.$fields.each(function() {
    const $input = $(this);
    if ($input.val() && combinedQuery) {
      combinedQuery = combinedQuery + '|' + '(' + self.parseValue($input) + ')';
    } else if ($input.val()) {
      combinedQuery = '(' + self.parseValue($input) + ')';
    }
  });

  if (this.$excludeField.val()) {
    excludeQuery = self.parseValue(this.$excludeField);
  }

  return { combinedQuery, excludeQuery };
};

/**
 * Parses the values of the individual input, combining the words with
 * whichever operator the input requires, as determined by its data-operator attribute.
 * @returns {string} The various words joined together with the correct operator
 */
KeywordModal.prototype.parseValue = function($input) {
  const words = $input
    .val()
    .replace(/"/g, '')
    .split(' ');
  const operator = $input.data('operator');
  if (operator === 'and') {
    return words.join(' + ');
  } else if (operator === 'or') {
    return words.join(' | ');
  } else if (operator === 'exact') {
    return '"' + $input.val().replace(/"/g, '') + '"';
  } else if (operator === 'exclude') {
    // Remove all dashes and replace with single dash, 
    // Add + between words
    return $input
      .val()
      .replace(/-/g, '-')
      .split(' ')
      .join(' + ');
  }
};

/**
 * Fire an event to GTM
 * @param {string} actionLabel - Name of the action to register with GA
 */
KeywordModal.prototype.fireEvent = function(actionLabel) {
  // Updating this to use DataLayer for GTM
  customEvent({
    eventName: 'fecCustomEvent',
    eventCategory: 'Legal interactions',
    eventAction: actionLabel,
    eventValue: 1
  });
};
