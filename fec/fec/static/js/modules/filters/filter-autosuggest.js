/**
 * Handles the @see Autosuggest functionality inside an instance of @see AutosuggestFilterBlock
 * 
 * 
 */

// const $ = require('jquery');
const URI = require('urijs');
const _ = require('underscore');
import { Autosuggest, dataTypes, fetchInit } from '../autosuggest';
import sanitizeValue from '../helpers';
import { stripDoubleQuotes } from '../utils';

const ID_PATTERN = /^\w{9}$/;

/**
 * Doesn't actually create slugs.
 * Trims any whitespace at the ends,
 * turns spaces into dashes,
 * removes lowercase letters, numbers, and :._-
 * @param {string} value - A string to be converted
 * @returns string Formatted
 */
function slugify(value) {
  return value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9:._-]/gi, '');
}

/**
 * Returns a string
 * @param {object} datum
 * @param {string} datum.name
 * @param {(string | number)} datum.id
 *
 * @returns {string} Formatted like 'Committee Name (COMMITTEE_ID)' or 
 */
function formatLabel(datum) {
  console.log('formatLabel()');
  return datum.name
    ? datum.name + ' (' + datum.id + ')'
    : '"' + stripDoubleQuotes(datum.id) + '"';
}

/**
 * Converts a given string to a slug and appends '-checkbox' to the end
 * @param {string} value - Input to convert to a slug
 *
 * @returns {string} A slug of value with '-checkbox' appended to the end
 */
function formatId(value) {
  console.log('formatId(value): ', value);
  return slugify(value) + '-checkbox';
}

/**
 * 
 */
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
 * @param {object} data - Object of the values to use for the new checkbox item
 * @param {string} data.id - Assigned as the <input id=""> and <label for="">
 * @param {string} data.label - The human-readable text for the <label>
 * @param {string} data.name - Assigned as the <input name="">
 * @param {string|number} data.value - To be assigned to <input value="">
 * @returns {string} to be used as the innerHTML of a checkbox item
 */
function template_checkbox(data) {
  console.log('template_checkbox(data): ', data);
  return `<input 
      id="${data.id}"
      name="${data.name}"
      value="${data.value}"
      type="checkbox"
      checked
    />
    <label for="${data.id}">${data.label}</label>
    <button class="dropdown__remove"><span class="u-visually-hidden">Remove</span></button>`;
}

/**
 * Creates a new FilterAutosuggest
 * @constructor
 *
 * @param {(string | HTMLElement)} elementSelector - The element to become this.element, or a string to use with document.querySelector()
 * @param {DOMStringMap} dataset - ex: {filter: 'autosuggest', name: 'committee_id', dataset: 'committees'}
 * @param {string='true'} allowText - 
 *
 * @property {jQuery} $elm - Inherited from Filter
 * @property {jQuery} $input - Inherited from Filter
 * @property {jQuery} this.$filterLabel - Inherited from Filter
 *
 * @property {HTMLElement} element - The main Autosuggest <div>, div.filter.js-filter.autosuggest-filter
 * @property {boolean} allowText - // TODO: what is this?
 * @property {HTMLInputElement} field - The main <input> element inside the Autosuggest filter
 * @property {HTMLButtonElement} button - The <button> in the Autosuggest with the magnifying glass
 * @property {HTMLElement} selected - The <ul> that holds the previously-chosen checkboxes above the autosuggest input field
 * @property {boolean} searchEnabled - ready by automated tests
 * @property {object} dataDetails - One of autosuggest.datatypes[]
 *
 * @listens autosuggest:open // TODO: add these (it doesn't listen to autosuggest:open)
 */
function FilterAutosuggest(elementSelector, allowText) {
  console.log('FilterAutosuggest(elementSelector, allowText)', elementSelector, allowText);
  // If elementSelector is a string, use it to find this target element,
  // else save the elementSelector element as this.element
  this.element = typeof elementSelector == 'string' ? document.querySelector(elementSelector) : elementSelector;
  // this.queryType = this.element.dataset.name; // this.element.dataset.dataset || 
  // console.log('  this.queryType: ', this.queryType);
  this.allowText = allowText;

  this.field = this.element.querySelector('input[type="text"]');

  console.log('  this.element: ', this.element);
  console.log('  this.field: ', this.field);

  console.log('  this.field.dataset: ', this.field.dataset);

  this.dataDetails = dataTypes[this.field.dataset.searchType];
  this.queryFieldName = this.dataDetails.queryFieldName;

  this.button = this.element.querySelector('button');
  this.selected = this.element.querySelector('.dropdown__selected');
  console.log('  this.button: ', this.button);
  console.log('  this.selected: ', this.selected);

  // Create the Autosuggest elements (and set this.autosuggest)
  this.autosuggestInit();

  this.element.addEventListener('click', this.handleClick.bind(this));

  const textInput = this.element.querySelector('input[type="text"]');
  if (textInput) textInput.addEventListener('change', this.handleChange.bind(this));

  const checkboxes = this.element.querySelectorAll('input[type="checkbox"]');
  if (checkboxes) {
    checkboxes.forEach(eachCheckbox => {
      eachCheckbox.addEventListener('change', this.handleCheckbox.bind(this));
    });
  }

  document.body.addEventListener('filter:modify', this.changeDataset.bind(this));

  this.field.addEventListener('autosuggest:select', this.handleSelect.bind(this));
  this.field.addEventListener('autosuggest:results', this.handleResults.bind(this));
  this.field.addEventListener('keyup', this.handleKeypress.bind(this));

  document.body.addEventListener('tag:removed', this.removeCheckbox.bind(this));
  document.body.addEventListener('tag:removeAll', this.removeAllCheckboxes.bind(this));

  this.disableButton();
}

/**
 * Creates the Autosuggest elements. Called by the constructor before event listeners are added.
 */
FilterAutosuggest.prototype.autosuggestInit = function() {
  console.log('FilterAutosuggest.autosuggestInit()');
  const opts = {
    // type: this.dataDetails.type,
    // minLength: 3,
    // hint: false, // TODO: what's this?
    // highlightFirst: true
    // insideFilter: true
  };

  // console.log('  this.element: ', this.element);
  // console.log('  opts.queryType: ', opts.queryType);
  // if ((opts.queryType == 'q' || opts.queryType == 'qq')  ) opts.queryType = opts.
  // if (this.allowText && this.queryType) opts.dataset = this.dataDetails;
  // else if (this.allowText && !this.dataDetails) opts.dataset = textDataset;
  // console.log('    opts.queryType: ', opts.queryType);

  this.autosuggest = new Autosuggest(this.field);

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
 * Called when this.field receives event autosuggest:results
 * Calls @see FilterAutosuggest.setFirstItem
 * @param {CustomEvent} e - 
 */
FilterAutosuggest.prototype.handleResults = function(e) {
  console.log('FilterAutosuggest.handleResults(e): ', e);
  this.setFirstItem();
};

/**
 * Set the firstItem to a datum upon each rendering of results
 * this way clicking enter or the button will submit with this datum.
 * Called by @see FilterAutosuggest.handleResults
 */
FilterAutosuggest.prototype.setFirstItem = function() {
  console.log('DOES THIS DO ANYTHING? FilterAutosuggest.setFirstItem()');
  // this.firstItem = arguments[1];
  // Add a hover class to the first item to indicate it will be selected
  const suggestions = this.element.querySelectorAll('.as-suggestion');

  if (suggestions && suggestions.length > 0) {
    this.autosuggest.highlightFirstResult();
    this.enableButton();
    // this.field.setAttribute('aria-expanded', true);

  } else {
    this.disableButton();
  }
};

/**
 * 
 * @param {(CustomEvent|KeyboardEvent)} e - Custom event if it's a click, but KeyboardEvent from the keyboard
 * @param {*} datum - 
 */
FilterAutosuggest.prototype.handleSelect = function(e) {
  console.log('FilterAutosuggest.handleSelect(e) (AUTOSUGGEST:SELECT): ', e);

  
  console.log('  e.target.type: ', e.target.type);

  const datum = e.detail.selection.value;
  /*
  datum should be in the format of:
    {
      name: 'BERGMANFORCONGRESS',
      id: 'C00614214',
      is_active: true,
      type: 'committee'
    }
  */

  const id = formatId(datum.id);
  console.log('  id: ', id);
  this.appendCheckbox({
    name: this.dataDetails.queryFieldName,
    value: datum.id,
    datum: datum
  });
  // this.datum = null;

  console.log('  this.element: ', this.element);
  console.log('  this.$elm: ', this.$elm);
  const relatedLabels = this.element.querySelectorAll(`label[for="${id}"]`);
  console.log('  relatedLabels: ', relatedLabels);
  relatedLabels.forEach(label => {
    console.log('    label: ', label);
    label.classList.add('is-loading');
  });
  // this.$elm.find('label[for="' + id + '"]').addClass('is-loading');

  console.log('  this.button: ', this.button);
  this.button.focus();
  this.button.classList.add('is-loading');

  const newEvent = new CustomEvent('change', {
    // bubbles: true,
    detail: Object.assign({}, e.detail, {})
  });
  this.field.dispatchEvent(newEvent);
};

/**
 * 
 * @param {*} e - 
 */
FilterAutosuggest.prototype.handleKeypress = function(e) {
  // console.log('FilterAutosuggest.handleKeypress(e): ', e);
  this.handleChange();

  // const suggestion = this.element.querySelector('.as-suggestion');
  // if (suggestion) this.field.setAttribute('aria-expanded', 'true');
  // else this.field.setAttribute('aria-expanded', 'false');

  if (e.keyCode === 13) {
    this.handleSubmit(e);
  }
};

/**
 * Enables or disables the search button
 * Called on this.field.change and this.field.keyup
 */
FilterAutosuggest.prototype.handleChange = function(e) {
  console.log('FilterAutosuggest.handleChange(e): ', e);
  console.log('  this.field', this.field);
  console.log('  this.field.value', this.field.value);

  console.log('  this.allowText: ', this.allowText);
  console.log('  this.field: ', this.field);
  console.log('  this.datum: ', this.datum);

  if (
    (this.allowText && this.field.value.length > 1) ||
    this.datum
  ) {
    console.log('    enabling the button');
    this.enableButton();

  } else if (
    this.field.value.length === 0 ||
    (!this.allowText && this.field.value.length < 3)
  ) {
    console.log('    disabling the button');
    this.datum = null;
    this.disableButton();
  }
};

/**
 * @param {Event?} e -
 */
FilterAutosuggest.prototype.handleCheckbox = function(e) {
  console.log('FilterAutosuggest.handleCheckbox(e): ', e);
  console.log('  typeof e: ', typeof e);
  console.log('  this.field', this.field);
  console.log('  this.field.value', this.field.value);

  const input = e.target;
  const id = input.getAttribute('id');
  const label = this.element.querySelector('label[for="' + id + '"]');
  let loadedOnce = input.getAttribute('data-loaded-once') || false; // Make sure this works, since there's a dash in the name

  if (loadedOnce || loadedOnce === true) label.classList.add('is-loading');

  console.log('  input: ' + input);
  console.log('  input: ', input);
  console.log('  id: ', id);
  console.log('  label: ', label);
  input.dataset['loadedOnce'] = true;
  console.log('  input: ' + input);
  console.log('  input: ', input);
};

/**
 * Only cares about the click if .dropdown__remove is the target
 * (.dropdown__remove) is the X that appears to the right of a hovered filter that's been deselected
 * @param {PointerEvent} e
 */
FilterAutosuggest.prototype.handleClick = function(e) {
  console.log('FilterAutosuggest.handleClick(e): ', e);

  if (e.target.classList.contains('dropdown__remove'))
    this.removeCheckbox(e);

  // console.log('  typeof e.target: ', typeof e.target);

  // if (e.target.tagName.toLowerCase() === 'input') {
  //   console.log('  clicked an input');
  //   // clicked the <input>, so we don't care
  // } else if (e.target.classList.contains('dropdown__remove')) {
  //   console.log('    if');
  //   this.removeCheckbox(e);
  // } else if (e.target.tagName.toLowerCase() === 'label') {
  //   console.log('  clicked a label');

  // } else {
  //   console.log('    ELSE NOTHING');
  // }
};

/**
 * 
 * @param {PointerEvent} e - 
 * @param {object} [opts] - 
 */
FilterAutosuggest.prototype.removeCheckbox = function(e, opts) {
  console.log('FilterAutosuggest.removeCheckbox(e, opts): ', e, opts);
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
FilterAutosuggest.prototype.removeAllCheckboxes = function() {
  console.log('FilterAutosuggest.removeAllCheckboxes()');
  while (this.selected.firstChild) {
    this.selected.removeChild(this.selected.firstChild);
  }
};

/**
 * 
 * @param {CustomEvent} e - from autocomplete
 */
FilterAutosuggest.prototype.handleSubmit = function(e) {
  console.log('FilterAutosuggest.handleSubmit(e): ', e);
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
FilterAutosuggest.prototype.clearInput = function() {
  console.log('FilterAutosuggest.clearInput()');
  this.field.value = null;
  const newEvent = new CustomEvent('change', {
    // bubbles: true,
    detail: {}
  });
  this.field.dispatchEvent(newEvent);
  this.disableButton();
};

/**
 * 
 */
FilterAutosuggest.prototype.enableButton = function() {
  // console.log('FilterAutosuggest.enableButton()');
  this.searchEnabled = true;
  this.button.classList.remove('is-disabled');
  this.button.setAttribute('tabindex', '1');
  this.button.removeAttribute('disabled');
};

/**
 * 
 */
FilterAutosuggest.prototype.disableButton = function() {
  // console.log('FilterAutosuggest.disableButton()');
  this.searchEnabled = false;
  this.button.classList.add('is-disabled');
  this.button.setAttribute('tabindex', '-1');
  this.button.setAttribute('disabled', true);
};

/**
 *
 * @param {object} opts - Data object
 * @param {string} opts.name - String in the form of [type]_id. Passed to formatCheckboxData
 * @param {string} opts.value - Passed to formatCheckboxData
 * @param {object} opts.datum - Data object from the clicked element
 * @param {boolean} opts.datum.is_active - From the API
 * @param {string} opts.datum.id -From the API (e.g. C001234567)
 * @param {string} opts.datum.name - The text displayed on the checkbox
 * @param {string} opts.datum.type - Value from dataTypes[type].name
 */
FilterAutosuggest.prototype.appendCheckbox = function(opts) {
  console.log('FilterAutosuggest.appendCheckbox(opts): ', opts);
  const data = this.formatCheckboxData(opts);
  const dataIDelement = this.element.querySelector(`#${data.id}`);

  if (dataIDelement) return;

  const checkboxItem = document.createElement('li');
  console.log('  checkboxItem: ', checkboxInput);
  checkboxItem.innerHTML = template_checkbox(data);
  console.log('  checkboxItem.innerHTML: ', checkboxItem.innerHTML);
  this.selected.appendChild(checkboxItem);
  const checkboxInput = checkboxItem.querySelector('input');

  console.log('  checkboxInput: ', checkboxInput);

  const newEvent = new CustomEvent('change', {
    bubbles: true, // Bubbles so FilterTags
    detail: {}
  });
  checkboxInput.dispatchEvent(newEvent);

  this.clearInput();
};

/**
 * TODO: get rid of Underscore
 * @param {*} input - 
 * @returns {object} Structured like {name: '', label: '', value: , id: 'name-value-checkbox'}
 */
FilterAutosuggest.prototype.formatCheckboxData = function(input) {
  console.log('FilterAutosuggest.formatCheckboxData(input): ', input);
  const output = {
    name: input.name,
    label: input.datum
      ? _.escape(formatLabel(input.datum))
      : stripDoubleQuotes(input.value),
    value: _.escape(stripDoubleQuotes(input.value)),
    id: this.dataDetails.queryFieldName + '-' + formatId(input.value)
  };
  console.log('  output: ', output);
  return output;
};

/**
 * Called from @see autosuggest-filter.fromQuery()
 * When the page loads with query params for this filter, the param values will be entity IDs (candidate ID, etc)
 * We want to go get the human-friendly values so we show something like "My PAC (C001234567" instead of "C001234567"
 * @param {string[]} values - 
 */
FilterAutosuggest.prototype.getFilters = function(values) {
  console.log('FilterAutosuggest.getFilters(values): ', values);
  const self = this;
  if (this.dataDetails) {
    const qType = this.dataDetails.type;
    const qFieldName = this.dataDetails.queryFieldName;
    const qIDs = values.filter(value => {
      return ID_PATTERN.test(value);
    });
    values.forEach(value => {
      self.appendCheckbox({
        name: self.dataDetails.queryFieldName,
        label: ID_PATTERN.test(value) ? 'Loading&hellip;' : value,
        value: value
      });
    });

    if (qIDs.length) {
      const qPath = URI(window.API_LOCATION)
        .path([window.API_VERSION, qType].join('/'))
        .addQuery('api_key', window.API_KEY_PUBLIC)
        .addQuery(qFieldName, qIDs)
        .toString();

        fetch(qPath, fetchInit)
        .then(response => response.json())
        .then(data => {
          self.updateFilters(data);
        });
    } else {
      // no qIDs, nothing to do
    }
  } else {
    console.log('  else - no this.dataDetails');
  }
};

/**
* TODO: update this whole thing
* When loading a preset checkbox filter, this will change the label of the checkbox from just ID (example: C00431445) to the full title for readability (example: OBAMA FOR AMERICA (C00431445))
* @param {?} response - 
*/
FilterAutosuggest.prototype.updateFilters = function(response) {
  console.log('FilterAutosuggest.updateFilters(response): ', response);
  const self = this;

  if (this.dataDetails) {
    const queryFieldName = this.dataDetails.queryFieldName;
    response.results.forEach(function(result) {
      const labelText = result.name + ' (' + result[queryFieldName] + ')';
      console.log('  labelText: ', labelText);
      // How do we find this checkbox?
      const checkboxIdentifier = `${queryFieldName}-${result[queryFieldName]}-checkbox`;
      console.log('  checkboxIdentifier: ', checkboxIdentifier);
      // Find the checkbox
      const theCheckbox = self.element.querySelector(`#${checkboxIdentifier}`);
      console.log('  theCheckbox: ', theCheckbox);
      // const labelElement = self.element.querySelector(
      //   `label[for="${checkboxIdentifier}"]`
      // );
      if (theCheckbox.labels[0]) {
        const labelElement = theCheckbox.labels[0];
        console.log('  labelElement: ', labelElement);

        labelElement.innerText = labelText;
      }

      // Get ready to dispatch a filter:renamed event

      const newEvent = new CustomEvent('filter:renamed', {
        bubbles: true,
        detail: {
          key: checkboxIdentifier,
          value: labelText
        }
      });
      // and make it broadcast that it's been renamed
      theCheckbox.dispatchEvent(newEvent);
    });
  } else {
    console.log('  ELSE NO DATASET');
  }
};

/**
 * Called when .js-filter-control is changed, which is part of
 * fec/data/template/macros/date.jinja, and
 * fec/data/templates/partials/reports-filter.jinja
 * @param {*} e - // TODO
 * @param {*} opts - // TODO
 */
FilterAutosuggest.prototype.changeDataset = function(e, opts) {
  console.log('FilterAutosuggest.changeDataset(e, opts): ', e, opts);
  console.log('  NEED TO DO THIS');
  // Method for changing the typeahead suggestion on the "contributor name" filter
  // when the "individual" or "committee" checkbox filter is changed
  // If the modify event names this filter, destroy it
  if (opts.filterName === this.dataDetails.name) {
    // TODO: Check this this.field.typeahead bit
    // TODO: do we need to destroy?
    // this.field.typeahead('destroy');
    // If the value array is only individuals and not committees
    // set the dataset to empty and re-init
    if (
      opts.filterValue.indexOf('individual') > -1 &&
      opts.filterValue.indexOf('committee') < 0
    ) {
      this.dataDetails = null;
      this.allowText = true;
      this.autosuggestInit();
    } else {
      // Otherwise initialize with the committee dataset
      this.dataDetails = datasets.committees;
      this.autosuggestInit();
    }
  }
};

module.exports = { FilterAutosuggest: FilterAutosuggest };
