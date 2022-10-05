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
function AutosuggestFilterBlock(selector) {
  console.log('AutosuggestFilterBlock(selector): ', selector);

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

  // data-allow-text either exists or doesn't; the template doesn't give it a value
  const allowText = this.element.hasAttribute('data-allow-text'); // TODO: check that this works
  console.log('  allowText: ', allowText);
  this.filterAs = new FilterAutosuggest(this.element, allowText);

  this.element.addEventListener('change', this.handleNestedChange.bind(this));
}

AutosuggestFilterBlock.prototype = Object.create(Filter.prototype);
AutosuggestFilterBlock.constructor = AutosuggestFilterBlock;

/**
 * Takes the URL
 * @param {object} query - Key/value pairs of the parameters from the page's URL
 * @returns {AutosuggestFilterBlock}
 */
AutosuggestFilterBlock.prototype.fromQuery = function(query) {
  console.log('AutosuggestFilterBlock.fromQuery(query)', query);
  console.log('  this.name: ', this.name);
  // Set values to If query includes a value for this filter's name (ex: 'committee_id')
  const values = query[this.name] ? ensureArray(query[this.name]) : [];
  this.filterAs.getFilters(values);
  console.log('  this: ', this);
  console.log('  this.filterAs: ', this.filterAs);
  // console.log('  this.filterAs.element: ', this.filterAs.element);
  const checkboxes = this.element.querySelectorAll('input[type="checkbox"]');
  console.log('  checkboxes: ', checkboxes);
  for (let i = 0; i < checkboxes.length; i++) {
    console.log('    for()');
    checkboxes[i].setAttribute('value', values[i]);
  }
  // checkboxes.value = values;
  console.log('  values: ', values);
  console.log('  this.autosuggest: ', this.autosuggest);
  // console.log('  this.autosuggest.element: ', this.autosuggest.element);
  console.log('  this.filterAs: ', this.filterAs);
  console.log('  this.filterAs.element: ', this.filterAs.element);
  // var values = query[this.name] ? Filter.ensureArray(query[this.name]) : [];

  console.log('  values: ', values);
  // this.autosuggest.getFilters(values);
  // this.autosuggest.$elm.find('input[type="checkbox"]').val(values);
  return this;
};

// Ignore changes on typeahead input
AutosuggestFilterBlock.prototype.handleChange = function(e) {
  //
  console.log('AutosuggestFilterBlock.handleChange(e): ', e);
};

/**
 * TODO: get rid of Underscore
 * @param {Event} e - 
 */
AutosuggestFilterBlock.prototype.handleNestedChange = function(e) {
  console.log('AutosuggestFilterBlock.handleNestedChange(e): ', e);
  const eTarget = e.target;
  const eTargetID = eTarget.getAttribute('id');
  const eTargetLabelElement = this.element.querySelector('[for="' + eTargetID + '"]');
  console.log('  input: ', eTarget);
  console.log('  id: ', eTargetID);
  console.log('  eTargetLabelElement: ', eTargetLabelElement);
  console.log('  input.getAttribute(type): ', eTarget.getAttribute('type'));

  // TODO: only proceed if this is input[type="checkbox"] ?
  if (eTarget.getAttribute('type') == 'checkbox') {
    console.log('  if–it is a checkbox!');
    // var eventName = input.is(':checked') ? 'filter:added' : 'filter:removed';
    const newEventName = eTarget.checked ? 'filter:added' : 'filter:removed';

    console.log('  newEventName: ', newEventName);
    const newEvent = new CustomEvent(
      newEventName,
      {
        bubbles: true,
        detail: { // value: _.escape(eTargetLabelElement.text()), // TODO: update this to ES6
          key: eTargetID,
          // value: _.escape(eTargetLabelElement.textContent),
          value: eTargetLabelElement.textContent,
          name: eTarget.getAttribute('name'),
          loadedOnce: true,
          filterLabel: eTargetLabelElement
        }
      }
    );
    console.log('  newEvent: ', newEvent);

    eTarget.dispatchEvent(newEvent);

  } else {
    console.log('  ELSE NOTHING');
    console.log('  eTarget: ', eTarget);
    console.log('  eTarget: ' + eTarget);
    console.log('  eTargetID: ', eTargetID);
    console.log('  eTargetLabelElement: ', eTargetLabelElement);
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

/*
AutosuggestFilterBlock.prototype.disable = function() {
  console.log('AutosuggestFilterBlock.disable()');
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

AutosuggestFilterBlock.prototype.enable = function() {
  console.log('AutosuggestFilterBlock.enable()');
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
*/
module.exports = { AutosuggestFilterBlock };
