
import { default as A11yDialog } from 'a11y-dialog';

/**
 * KeywordModal
 * @class
 * Creates a pop-up modal for advanced keyword searches
 * and processes the values of the various inputs to form a single search string
 * with all the proper boolean operators
 *
 * NOTE: This is a slightly adapted version of the one in the web app for use
 * on the legal resources landing page. Rather than updating the window.location.search param
 * it actually submits the form to whichever URL it's directed to
 */
function KeywordModal() {
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

  this.$elm.on('dialog:show', function() {
    $('body').css('overflow', 'hidden');
  });

  this.$elm.on('dialog:hide', function() {
    $('body').css('overflow', 'scroll');
  });

  /** Unique to CMS **/
  this.$hiddenField = this.$elm.find('input[type=hidden]');
}

/**
 * Handle a click event on the submit button
 * prevents the form from being submitted at first in order to create the search string
 * and then submits the form.
 * NOTE: This is unique to the CMS implementation
 */
KeywordModal.prototype.handleSubmit = function(e) {
  e.preventDefault();
  var queryString = this.generateQueryString();
  this.$hiddenField.val(queryString);
  this.$form.submit(); // TODO: jQuery deprecation? (.submit() )
};

/**
 * Converts the keyword modal value into a formatted search query string
 * @return {String} formatted search query string
 */
KeywordModal.prototype.generateQueryString = function() {
  let includeQuery = '';
  let excludeQuery = '';
  const self = this;

  this.$fields.each(function() {
    const $input = $(this);
    if ($input.val() && includeQuery) {
      includeQuery = includeQuery + '|' + '(' + self.parseValue($input) + ')';
    } else if ($input.val()) {
      includeQuery = '(' + self.parseValue($input) + ')';
    }
  });

  if (this.$excludeField.val()) {
    excludeQuery = self.parseValue(this.$excludeField);
  }
  var queryString =  includeQuery + excludeQuery;
  return queryString;
};

/**
 * Parses the values of the individual input, combining the words with
 * whichever operator the input requires, as determined by its data-operator attr
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
    return $input
      .val()
      .split(' ')
      .map(function(word) {
        return ' -' + word;
      })
      .join(' ');
  }
};

if ($('.js-keyword-modal').length > 0) {
  new KeywordModal();
}
