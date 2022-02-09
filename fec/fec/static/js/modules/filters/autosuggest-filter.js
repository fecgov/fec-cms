// TODO: double check that the autosuggest filters handle a generic user returnkey appropriately (type + returnkey without clicking)

/**
 * TODO: What does this file actually do?
 * Wraps filter-autosuggest
 */

let _ = require('underscore');

import { Filter } from './filter-base';
import { FilterAutoSuggest } from './filter-autosuggest';

/**
 * 
 * @param {String|HTMLElement} selector - How to find the element (string) or the selected element itself
 * 
 * @property {Boolean} allowText - True if this.element.dataset['allow-text'] !== undefined
 */
function AutoSuggestFilter(selector) {
  console.log('AutoSuggestFilter(selector): ', selector);
  
  this.element = typeof selector == 'string' ? document.querySelector(selector) : selector[0];
  console.log('  this.element: ', this.element);

  Filter.call(this, this.element);

  let key = this.element.dataset['dataset']; // TODO: RENAME THIS (caulking doesn't like it)
  // var allowText = this.$elm.data('allow-text') !== undefined;
  // var dataset = key ? typeahead.datasets[key] : null; // TODO: BRING THIS BACK AFTER RENAMING (caulking doesn't like it)
  // TODO: TESTING:
  // let key = ;
  let dataset = '/all';
  let allowText = this.element.dataset['allow-text'] !== undefined;
  this.asFilter = new FilterAutoSuggest(this.element, dataset, allowText);

  this.element.addEventListener('change', this.handleNestedChange.bind(this));
  // const checkboxes = this.asFilter.element.querySelectorAll('input[type="checkbox"]');
  // checkboxes.forEach(checkbox => {
    // checkbox.addEventListener('change', this.handleNestedChange.bind(this));
  // });
}

AutoSuggestFilter.prototype = Object.create(Filter.prototype);
AutoSuggestFilter.constructor = AutoSuggestFilter;

AutoSuggestFilter.prototype.fromQuery = function(query) {
  console.log('AutoSuggestFilter.fromQuery(query)', query);
  // var values = query[this.name] ? Filter.ensureArray(query[this.name]) : [];
  // this.autosuggest.getFilters(values);
  // this.autosuggest.$elm.find('input[type="checkbox"]').val(values);
  return this;
};

// Ignore changes on typeahead input
AutoSuggestFilter.prototype.handleChange = function(e) {
  //
  console.log('AutoSuggestFilter.handleChange(e): ', e);
};

/**
 * TODO: get rid of Underscore
 * @param {*} e - 
 */
AutoSuggestFilter.prototype.handleNestedChange = function(e) {
  console.log('AutoSuggestFilter.handleNestedChange(e): ', e);
  const input = e.target;
  const id = input.getAttribute('id');
  const label = this.element.querySelector('[for="' + id + '"]');

  console.log('  input: ', input);
  console.log('  id: ', id);
  console.log('  label: ', label);
  // TODO: only proceed if this is input[type="checkbox"] ?
  if (input.getAttribute('type') == 'checkbox') {

    // var eventName = input.is(':checked') ? 'filter:added' : 'filter:removed';
    let newEventName = input.hasAttribute('checked') ? 'filter:added' : 'filter:removed';

    input.dispatchEvent(new CustomEvent(newEventName, {
      value: _.escape(label.text()), // TODO: update this to ES6
      name: input.getAttribute('name'),
      loadedOnce: true
    }));

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

AutoSuggestFilter.prototype.disable = function() {
  let theInputs = this.element.querySelectorAll('input, label, button');
  theInputs.forEach(elem => {
    elem.classList.add('is-disabled');
    elem.setAttribute('disabled', true);
  });

  let checkboxes = this.element.querySelectorAll('input:checked');
  checkboxes.forEach(elem => {
    let thisCheckID = elem.getAttribute('id');
    window.dispatchEvent('filter:disabled', {
      key: thisCheckID
    });
  });
};

AutoSuggestFilter.prototype.enable = function() {
  let theInputs = this.element.querySelectorAll('input, label, button');
  theInputs.forEach(elem => {
    elem.classList.remove('is-disabled');
    elem.setAttribute('disabled', false);
  });

  let checkboxes = this.element.querySelectorAll('input:checked');
  checkboxes.forEach(elem => {
    let thisCheckID = elem.getAttribute('id');
    window.dispatchEvent('filter:enabled', {
      key: thisCheckID
    });
  });
};

module.exports = { AutoSuggestFilter: AutoSuggestFilter };
