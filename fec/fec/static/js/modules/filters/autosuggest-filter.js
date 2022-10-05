// TODO: double check that the autosuggest filters handle a generic user returnkey appropriately (type + returnkey without clicking)

/**
 * @class
 * @extends @see /fec/fec/static/js/modules/filters/filter-base.js#Filter .
 *
 * Builds the filter block for the left column;
 * that block includes the Autosuggest field, but also the label, checkboxes, and message for Filter added/removed
 * Adds @see Filter functionality to `<div class="filter js-filter autosuggest-filter" data-filter="autosuggest">`
 * which is created by @see /fec/data/templates/macros/filters/autosuggest-filters.jinja
 */

// const _ = require('underscore');

import { Filter } from './filter-base';
import { FilterAutosuggest } from './filter-autosuggest';
import { ensureArray } from '../helpers';

/**
 * @implements {Filter}
 * @constructor
 * @param {(string|HTMLElement|jQuery.fn.init)} selector - How to find the element (string) or the selected element itself
 *
 * @property {boolean} allowText - True if this.element.hasAttribute('data-allow-text') !== undefined
 * @property {HTMLElement} element
 * @property {HTMLInputElement} input
 */
function AutosuggestFilter(selector) {
  console.log('AutosuggestFilter(selector): ', selector);

  this.element = typeof selector == 'string' ? document.querySelector(selector) : selector[0];
  // if (typeof selector == 'string') this.element = document.querySelector(selector);
  // else if (selector[0].id) this.element = document.querySelector(`#${selector[0].id}`);
  // else this.element = selector[0];

  Filter.call(this, selector);

  console.log('  this.element: ', this.element);
  console.log('  this.$elm: ', this.$elm);
  console.log('  this.$input: ', this.$input);
  console.log('  this.element.hasAttribute(data-allow-text): ', this.element.hasAttribute('data-allow-text'));
  console.log('  this.element.dataset: ', this.element.dataset);

  // this.input = this.$input;

  // let key = this.element.dataset['dataset']; // TODO: RENAME THIS (caulking doesn't like it)
  // var allowText = this.element.hasAttribute('data-allow-text') !== undefined;
  // var dataset = key ? typeahead.datasets[key] : null; // TODO: BRING THIS BACK AFTER RENAMING (caulking doesn't like it)
  // TODO: TESTING: 
  // let key = ;
  let dataset = '/all';
  // data-allow-text either exists or doesn't; the template doesn't give it a value
  const allowText = this.element.hasAttribute('data-allow-text'); // TODO: check that this works
  console.log('  allowText: ', allowText);
  this.asFilter = new FilterAutosuggest(this.element, dataset, allowText);

  this.element.addEventListener('change', this.handleNestedChange.bind(this));
}

AutosuggestFilter.prototype = Object.create(Filter.prototype);
AutosuggestFilter.constructor = AutosuggestFilter;

/**
 * Takes the URL
 * @param {object} query - Key/value pairs of the parameters from the page's URL
 * @returns {AutosuggestFilterBlock}
 */
AutosuggestFilterBlock.prototype.fromQuery = function(query) {
  console.log('AutosuggestFilterBlock.fromQuery(query)', query);
  const values = query[this.name] ? ensureArray(query[this.name]) : [];
  this.asFilter.getFilters(values);
  console.log('  this: ', this);
  console.log('  this.asFilter: ', this.asFilter);
  // console.log('  this.asFilter.element: ', this.asFilter.element);
  const checkboxes = this.element.querySelectorAll('input[type="checkbox"]');
  console.log('  checkboxes: ', checkboxes);
  checkboxes.value = values;
  console.log('  values: ', values);
  console.log('  this.autosuggest: ', this.autosuggest);
  // console.log('  this.autosuggest.element: ', this.autosuggest.element);
  console.log('  this.asFilter: ', this.asFilter);
  console.log('  this.asFilter.element: ', this.asFilter.element);
  // var values = query[this.name] ? Filter.ensureArray(query[this.name]) : [];
  // this.autosuggest.getFilters(values);
  // this.autosuggest.$elm.find('input[type="checkbox"]').val(values);
  return this;
};

// Ignore changes on typeahead input
AutosuggestFilter.prototype.handleChange = function(e) {
  //
  console.log('AutosuggestFilter.handleChange(e): ', e);
};

/**
 * TODO: get rid of Underscore
 * @param {Event} e - 
 */
AutosuggestFilter.prototype.handleNestedChange = function(e) {
  console.log('AutosuggestFilter.handleNestedChange(e): ', e);
  const input = e.target;
  const id = input.getAttribute('id');
  const label = this.element.querySelector('[for="' + id + '"]');

  console.log('  input.getAttribute(type): ', input.getAttribute('type'));

  // TODO: only proceed if this is input[type="checkbox"] ?
  if (input.getAttribute('type') == 'checkbox') {
    console.log('  if');
    // var eventName = input.is(':checked') ? 'filter:added' : 'filter:removed';
    let newEventName = input.hasAttribute('checked') ? 'filter:added' : 'filter:removed';

    console.log('  newEventName: ', newEventName);
    const newEvent = new CustomEvent(newEventName, {
      // value: _.escape(label.text()), // TODO: update this to ES6
      value: _.escape(label.textContent),
      name: input.getAttribute('name'),
      loadedOnce: true
    });

    input.dispatchEvent(newEvent);

  } else {
    console.log('  ELSE NOTHING');
    console.log('  input: ', input);
    console.log('  input: ' + input);
    console.log('  id: ', id);
    console.log('  label: ', label);
  }
  
  // input.trigger(eventName, [
  //   {
  //     // key: id, // TODO: BRING THIS BACK AFTER RENAMING (caulking doesn't like it)
  //     value: _.escape(label.text()), // TODO: update this to ES6
  //     name: input.attr('name'),
  //     loadedOnce: true
  //   }
  // ]);
};

AutosuggestFilter.prototype.disable = function() {
  console.log('AutosuggestFilter.disable()');
  const theInputs = this.element.querySelectorAll('input, label, button');
  theInputs.forEach(elem => {
    elem.classList.add('is-disabled');
    elem.setAttribute('disabled', true);
  });

  const checkboxes = this.element.querySelectorAll('input:checked');
  checkboxes.forEach(elem => {
    const thisCheckID = elem.getAttribute('id');
    this.element.dispatchEvent('filter:disabled', {
      key: thisCheckID
    });
  });
};

AutosuggestFilter.prototype.enable = function() {
  console.log('AutosuggestFilter.enable()');
  const theInputs = this.element.querySelectorAll('input, label, button');
  theInputs.forEach(elem => {
    elem.classList.remove('is-disabled');
    elem.removeAttribute('disabled');
  });

  const checkboxes = this.element.querySelectorAll('input:checked');
  checkboxes.forEach(elem => {
    const thisCheckID = elem.getAttribute('id');
    this.element.dispatchEvent('filter:enabled', {
      key: thisCheckID
    });
  });
};

module.exports = { AutosuggestFilter };
