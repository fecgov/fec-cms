/**
 * TODO: what does this file actually do?
 * Wraps an instance of AutoSuggest
 * Wrapped by autosuggest-filter
 */

/* global API_LOCATION, API_VERSION, API_KEY_PUBLIC */

const $ = require('jquery');
const URI = require('urijs');
const _ = require('underscore');
import { AutoSuggest } from '../autoSuggest';
import sanitizeValue from '../helpers';
import { slugify, stripDoubleQuotes } from '../utils';

const ID_PATTERN = /^\w{9}$/;

/**
 * 
 * @param {*} value - 
 * @returns {String}
 */
function slugify_remove(value) { // TODO: test if we can remove this (likely with chiclets, etc)
  return value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9:._-]/gi, '');
}

/**
 * 
 * @param {*} datum 
 * @returns {String} Formatted like 'Committee Name (COMMITTEE_ID)' or 
 * TODO: where on the site does this return `"COMMITTEE_ID"` instead of `Committee Name (COMMITTEE_ID)`?
 */
function formatLabel(datum) {
  return datum.name
    ? datum.name + ' (' + datum.id + ')'
    : '"' + stripDoubleQuotes(datum.id) + '"';
}

/**
 * 
 * @param {String} value - Input to convert to a slug
 * @returns {String} A slug of value with '-checkbox' appended to the end
 */
function formatId(value) {
  return slugify(value) + '-checkbox';
}

var textDataset = {
  display: 'id',
  source: function(query, syncResults) {
    syncResults([{ id: sanitizeValue(query) }]);
  },
  templates: {
    suggestion: function(datum) {
      return '<span>Search for: "' + datum.id + '"</span>';
    }
  }
};

/**
 * Meant to be wrapped in <li>
 * @param {Object} data
 * @param {String} data.id
 * @param {String} data.label
 * @param {String} data.name
 * @param {String} data.value
 * @returns
 */
const template_checkbox = data => `
    <input 
      id="${data.id}"
      name="${data.name}"
      value="${data.value}"
      type="checkbox"
      checked
    />
    <label for="${data.id}">${data.label}</label>
    <button class="dropdown__remove">
    <span class="u-visually-hidden">Remove</span>
    </button>
`;

/**
 * 
 * @param {*} elementSelector - 
 * @param {*} dataset - 
 * @param {String='true'} allowText - 
 *
 * @property {HTMLInputElement} element - 
 * @property {String} queryType - 
 * @property {Boolean} allowText - // TODO: what is this?
 * @property {HTMLInputElement} field - // TODO: is this the same as this.element?
 * @property {String} fieldName - 
 * @property {HTMLButtonElement} button - 
 * @property {HTMLElement} selected - 
 *
 * @listens autoSuggest:open // TODO: add these
 */
function FilterAutoSuggest(elementSelector, dataset, allowText) {
  console.log('FilterAutoSuggest(elementSelector, dataset, allowText)', elementSelector, dataset, allowText);
  // If elementSelector is a string, use it to find this target element,
  // else save the elementSelector element as this.element
  this.element = typeof elementSelector == 'string' ? document.querySelector(elementSelector) : elementSelector;
  this.queryType = this.element.dataset.name;
  this.allowText = allowText;

  this.field = this.element.querySelector('input[type="text"]');
  this.fieldName = this.queryType || this.field.getAttribute('name');
  this.button = this.element.querySelector('button');
  this.selected = this.element.querySelector('.dropdown__selected');

  // Create the autoSuggest elements (and set this.autosuggest)
  this.autosuggestInit();

  // const textFields = this.element.querySelectorAll('input[type="text"]');
  // for (const field of textFields) {
  //   field.addEventListener('change', this.handleChange.bind(this));
  // }
  this.element.addEventListener('change', this.handleChange.bind(this));
  // this.element.addEventListener('as:changed', this.handleChange.bind(this));
  // this.$elm.on('change', 'input[type="text"]', this.handleChange.bind(this));

  // const checkboxes = this.element.querySelectorAll('input[type="checkbox"]');
  // console.log('  checkboxes: ', checkboxes);
  // checkboxes.forEach(check => {
  //   check.addEventListener('change', this.handleCheckbox.bind(this));
  // });
  // this.$elm.on('change', 'input[type="checkbox"]', this.handleCheckbox.bind(this));

  const dropdowns__remove = this.element.querySelectorAll('.dropdown__remove');
  dropdowns__remove.forEach(dropdown => {
    dropdown.addEventListener('change', this.removeCheckbox.bind(this));
  });
  // this.$elm.on('click', '.dropdown__remove', this.removeCheckbox.bind(this));

  // const suggestions = this.element.querySelectorAll('.as-suggestion');
  // suggestions.forEach(suggestion => {
  //   suggestion.addEventListener('mouseenter', this.handleHover.bind(this));
  // });
  // this.$elm.on('mouseenter', '.as-suggestion', this.handleHover.bind(this));

  document.body.addEventListener('filter:modify', this.changeDataset.bind(this));

  this.field.addEventListener('autoSuggest:select', this.handleSelect.bind(this));
  // this.field.addEventListener('selection', this.handleSelect.bind(this));
  // this.field.addEventListener('typeahead:autocomplete', this.handleAutocomplete.bind(this));
  // this.field.addEventListener('typeahead:render', this.setFirstItem.bind(this));
  // this.field.addEventListener('keyup', this.handleKeypress.bind(this));
  // this.field.addEventListener('click', this.handleSubmit.bind(this));

  document.body.addEventListener('tag:removed', this.removeCheckbox.bind(this));
  document.body.addEventListener('tag:removeAll', this.removeAllCheckboxes.bind(this));

  this.disableButton();
}

/**
 * 
 */
FilterAutoSuggest.prototype.autosuggestInit = function() {
  const opts = { minLength: 3, hint: false, highlight: true };
  if (this.allowText && this.queryType) {
    // this.field.autosuggest(opts, textDataset, this.dataset);
    this.autosuggest = new AutoSuggest(this.field, this.queryType, this.dataset, opts);

  } else if (this.allowText && !this.dataset) {
    // this.field.autosuggest(opts, textDataset);
    this.autosuggest = new AutoSuggest(this.field, this.queryType, null, opts);

  } else {
    // this.field.autosuggest(opts, this.dataset);
    this.autosuggest = new AutoSuggest(this.field, this.queryType, opts);
  }

  // set this aria-live attribute to 'polite' for this .as-menu
  const menus = this.element.querySelectorAll('.as-menu');
  menus.forEach(item => {
    // TODO: do we need this forEach or can we skip it because querySelector returns one element?
    item.setAttribute('aria-live', 'polite');
  });

  // set this aria-live attribute to 'polite' for this .as-menu
  const inputs = this.element.querySelectorAll('.as-input');
  inputs.forEach(item => {
    // TODO: do we need this forEach or can we skip it because querySelector returns one element?
    item.removeAttribute('aria-readonly').setAttribute('aria-expanded', 'false');
  });
};

/**
 * 
 */
FilterAutoSuggest.prototype.setFirstItem = function() {
  // Set the firstItem to a datum upon each rendering of results
  // This way clicking enter or the button will submit with this datum
  this.firstItem = arguments[1];
  // Add a hover class to the first item to indicate it will be selected
  const suggestions = this.element.querySelector('.as-suggestion');
  suggestions[0].classList.add('as-cursor');
  // $(this.$elm.find('.as-suggestion')[0]).addClass('as-cursor');
  if (suggestions.length > 0) {
    this.enableButton();
    this.field.setAttribute('aria-expanded', true);
  }
  // if (this.$elm.find('.as-suggestion').length > 0) {
  //   this.enableButton();
  //   this.$field.attr('aria-expanded', 'true');
  // }
};

/**
 * 
 * @param {CustomEvent/KeyboardEvent} e - Custom event if it's a click, but KeyboardEvent from the keyboard
 * @param {*} datum - 
 */
FilterAutoSuggest.prototype.handleSelect = function(e) {
  console.log('FilterAutoSuggest.handleSelect(e) (AUTOSUGGEST:SELECT): ', e);

  console.log('e.target.type: ', e.target.type);

  const datum = e.detail.selection.value;

  const id = formatId(datum.id);
  console.log('id: ', id);
  this.appendCheckbox({
    name: this.fieldName,
    value: datum.id,
    datum: datum
  });
  // this.datum = null;

  console.log('this.element: ', this.element);
  const relatedLabels = this.element.querySelectorAll(`label[for="${id}"]`);
  console.log('relatedLabels: ', relatedLabels);
  relatedLabels.forEach(label => {
    console.log('  label: ', label);
    label.classList.add('is-loading');
  });
  // this.$elm.find('label[for="' + id + '"]').addClass('is-loading');

  console.log('this.button: ', this.button);
  this.button.focus();
  this.button.classList.add('is-loading');

  // this.element.dispatchEvent(new CustomEvent('as:changed', e));
  e.target.dispatchEvent(new CustomEvent('change', e));
};

/**
 * 
 * @param {*} e - 
 */
// FilterAutoSuggest.prototype.handleKeypress = function(e) {
//   console.log('FilterAutoSuggest.handleKeypress(e): ', e);
//   this.handleChange();

//   // const suggestion = this.element.querySelector('.as-suggestion');
//   // if (suggestion) this.field.setAttribute('aria-expanded', 'true');
//   // else this.field.setAttribute('aria-expanded', 'false');

//   if (e.keyCode === 13) {
//     this.handleSubmit(e);
//   }
// };

/**
 * 
 */
FilterAutoSuggest.prototype.handleChange = function(e) {
  console.log('FilterAutosuggest.handleChange(e): ', e);
  console.log('  this.field', this.field);
  console.log('  this.field.value', this.field.value);

  // if event comes from input[type="text"]'):
  if (e.target.type == 'text') {
    console.log('  e.target.type == text');

    if (
      (this.allowText && this.field.value.length > 1) ||
      this.datum
    ) {
      this.enableButton();

    } else if (
      this.field.value.length === 0 ||
      (!this.allowText && this.field.value.length < 3)
    ) {
      this.datum = null;
      this.disableButton();
    }
  } else if (e.target.type == 'checkbox') {
    // if event comes from input[type="checkbox"]:
    console.log('  e.target.type == checkbox');

    // console.log('FilterAutoSuggest.handleCheckbox(e): ', e);
    const input = e.target;
    const id = input.getAttribute('id');
    const label = this.element.querySelector('label[for="' + id + '"]');
    const loadedOnce = input.dataset['loaded-once'] || false; // Make sure this works, since there's a dash in the name

    if (loadedOnce || loadedOnce === true) label.classList.add('is-loading');

    console.log('  input: ' + input);
    console.log('  input: ', input);
    console.log('  id: ', id);
    console.log('  label: ', label);
    input.dataset['loaded-once'] = true;
  } else {
    console.log('  ELSE NOTHING');
  }
};

/**
 * 
 * @param {*} e - 
 * @param {*} opts - 
 */
FilterAutoSuggest.prototype.removeCheckbox = function(e, opts) {
  let input = e.target;

  // tag removal
  if (opts) {
    const inputID = document.getElementById(opts.key);
    input = this.selected.querySelector(`#${inputID}`);
  }

  input.closest('li').remove();
};

/**
 * 
 */
FilterAutoSuggest.prototype.removeAllCheckboxes = function() {
  while (this.selected.firstChild) {
    this.selected.removeChild(this.selected.firstChild);
  }
};

/**
 * 
 */
// FilterAutoSuggest.prototype.handleHover = function() {
//   console.log('FilterAutoSuggest.handleHover(): ');
//   const itemsWithCursor = this.element.querySelectorAll('.as-sugggestion.as-cursor');
//   for (const item in itemsWithCursor) {
//     item.classList.remove('as-cursor');
//   }
//   // this.$elm.find('.as-suggestion.as-cursor').removeClass('as-cursor');
// };

/**
 * 
 * @param {CustomEvent} e - from autocomplete
 */
FilterAutoSuggest.prototype.handleSubmit = function(e) {
  console.log('FilterAutoSuggest.handleSubmit(e): ', e);
  console.log('  this.datum: ', this.datum);

  this.datum = e.detail.selection.value;

  if (this.datum) {
    console.log('  if this.datum');
    this.handleSelect(e, this.datum);

  } else if (!this.datum && !this.allowText) {
    console.log('  else if !this.datum && !this.allowText');
    this.handleSelect(e, this.firstItem);

  } else if (this.allowText && this.field.value.length > 0) {
    console.log('  this.allowText && this.field.value.length');
    this.handleSelect(e, { id: this.field.value });
  } else {
    console.log('  ELSE FAILED');
  }
};

/**
 * 
 */
FilterAutoSuggest.prototype.clearInput = function() {
  console.log('FilterAutoSuggest.clearInput()');
  this.field.value = null;
  this.field.dispatchEvent(new CustomEvent('change', { source: 'clearInput()' }));
  this.disableButton();
};

/**
 * 
 */
FilterAutoSuggest.prototype.enableButton = function() {
  console.log('FilterAutoSuggest.enableButton()');
  this.searchEnabled = true;
  this.button.classList.remove('is-disabled');
  this.button.setAttribute('tabindex', '1');
  this.button.setAttribute('disabled', false);
};

/**
 * 
 */
FilterAutoSuggest.prototype.disableButton = function() {
  console.log('FilterAutoSuggest.disableButton()');
  this.searchEnabled = false;
  this.button.classList.add('is-disabled');
  this.button.setAttribute('tabindex', '-1');
  this.button.setAttribute('disabled', false); // TODO: should this be true inside the disableButton function?
};

/**
 *
 * @param {Object} opts - 
 */
FilterAutoSuggest.prototype.appendCheckbox = function(opts) {
  console.log('FilterAutoSuggest.appendCheckbox(opts): ', opts);
  const data = this.formatCheckboxData(opts);
  const dataIDelement = this.element.querySelector(`#${data.id}`);

  if (dataIDelement) return;

  const checkboxItem = document.createElement('li');
  checkboxItem.innerHTML = template_checkbox(data);
  this.selected.appendChild(checkboxItem);
  const checkboxInput = checkboxItem.querySelector('input');

  console.log('  checkboxInput: ', checkboxInput);

  checkboxInput.dispatchEvent(new CustomEvent('change', { source: 'appendCheckbox' }));

  this.clearInput();
};

/**
 * TODO: get rid of Underscore
 * @param {*} input - 
 * @returns {Object} Structured like {name: '', label: '', value: , id: 'name-value-checkbox'}
 */
FilterAutoSuggest.prototype.formatCheckboxData = function(input) {
  const output = {
    name: input.name,
    label: input.datum
      ? _.escape(formatLabel(input.datum))
      : stripDoubleQuotes(input.value),
    value: _.escape(stripDoubleQuotes(input.value)),
    id: this.fieldName + '-' + formatId(input.value)
  };

  return output;
};

/**
 * TODO: update this whole thing
 * @param {*} values - 
 */
FilterAutoSuggest.prototype.getFilters = function(values) {
  console.log('FilterAutoSuggest.getFilters(values): ', values);
  const self = this;
  if (this.dataset) {
    var dataset = this.dataset.name + 's';
    var nameID = this.dataset.name + '_id';
    var ids = values.filter(function(value) {
      return ID_PATTERN.test(value);
    });
    values.forEach(function(value) {
      self.appendCheckbox({
        name: self.fieldName,
        label: ID_PATTERN.test(value) ? 'Loading&hellip;' : value,
        value: value
      });
    });
    if (ids.length) {
      console.log('  if (ids.length)');
      $.getJSON(
        URI(API_LOCATION)
          .path([API_VERSION, dataset].join('/'))
          .addQuery('api_key', API_KEY_PUBLIC)
          .addQuery(nameID, ids)
          .toString()
      ).done(this.updateFilters.bind(this));
    }
  }
};

/**
* TODO: update this whole thing
* When loading a preset checkbox filter, this will change the label of the checkbox from just ID (example: C00431445) to the full title for readability (example: OBAMA FOR AMERICA (C00431445))
* @param {?} response - 
*/
FilterAutoSuggest.prototype.updateFilters = function(response) {
  console.log('FilterAutoSuggest.updateFilters(response): ', response);
  var self = this;

  if (this.dataset) {
    const nameID = this.dataset.name + '_id';
    response.results.forEach(function(result) {
      var label = result.name + ' (' + result[nameID] + ')';
      self.$elm
        .find(
          'label[for="' + self.fieldName + '-' + result[nameID] + '-checkbox"]'
        )
        .text(label);
      self.$elm
        .find('#' + self.fieldName + '-' + result[nameID] + '-checkbox')
        .trigger('filter:renamed', [
          {
            key: self.fieldName + '-' + result[nameID] + '-checkbox',
            value: label
          }
        ]);
    });
  }
};

/**
 * 
 * @param {*} e - 
 * @param {*} opts - 
 */
FilterAutoSuggest.prototype.changeDataset = function(e, opts) {
  console.log('FilterAutoSuggest.changeDataset(e, opts): ', e, opts);
  // Method for changing the typeahead suggestion on the "contributor name" filter
  // when the "individual" or "committee" checkbox filter is changed
  // If the modify event names this filter, destroy it
  if (opts.filterName === this.fieldName) {
    // TODO: Check this this.field.typeahead bit
    // TODO: do we need to destroy?
    // this.field.typeahead('destroy');
    // If the value array is only individuals and not committees
    // set the dataset to empty and re-init
    if (
      opts.filterValue.indexOf('individual') > -1 &&
      opts.filterValue.indexOf('committee') < 0
    ) {
      this.dataset = null;
      this.allowText = true;
      this.autosuggestInit();
    } else {
      // Otherwise initialize with the committee dataset
      this.dataset = typeahead.datasets.committees;
      this.autosuggestInit();
    }
  }
};

module.exports = { FilterAutoSuggest: FilterAutoSuggest };
