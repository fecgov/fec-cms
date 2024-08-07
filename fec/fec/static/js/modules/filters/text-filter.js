import Inputmask from 'inputmask';
import { default as _escape } from 'underscore/modules/escape.js';

import { default as CheckboxFilter } from './checkbox-filter.js';
import { default as Filter, ensureArray } from './filter-base.js';

export default function TextFilter(elm) {
  Filter.call(this, elm);

  this.id = this.$input.attr('id');

  this.$submit = this.$elm.find('button');

  this.$input.on('change', this.handleChange.bind(this));
  this.$input.on('keyup', this.handleKeyup.bind(this));
  this.$input.on('blur', this.handleBlur.bind(this));

  if (this.$input.data('inputmask')) {
    // this.$input.inputmask();
    Inputmask({
      mask: this.$input.data('inputmask')
    }).mask(this.$input);
  }

  this.checkboxIndex = 1;
}

TextFilter.constructor = TextFilter;
TextFilter.prototype = Object.create(Filter.prototype);

TextFilter.prototype.fromQuery = function(query) {
  const self = this;
  let values = query[this.name] ? ensureArray(query[this.name]) : [];
  values = values.reverse();
  values.forEach(function(value) {
    self.appendCheckbox(value);
  });
  return this;
};

TextFilter.prototype.handleChange = function() {
  const value = this.$input.val();
  const loadedOnce = this.$input.data('loaded-once') || false;
  const button = this.$submit;

  // set the button focus within a timeout
  // to prevent change event from firing twice
  setTimeout(function() {
    button.focus(); // TODO: jQuery deprecation
  }, 0);

  if (value.length > 0) {
    this.$submit.removeClass('is-disabled');
    this.appendCheckbox(value);
  } else {
    this.$submit.addClass('is-disabled');
  }

  if (loadedOnce) {
    this.$submit.addClass('is-loading');
  }

  this.$input.data('loaded-once', true);
};

TextFilter.prototype.handleKeyup = function() {
  this.$submit.removeClass('is-disabled');
};

TextFilter.prototype.handleBlur = function() {
  if (this.$input.val().length === 0) {
    this.$submit.addClass('is-disabled');
  }
};

const template_checkbox = value => `
  <li>
    <input
      id="${value.id}"
      name="${value.name}"
      value="${value.value}"
      type="checkbox"
      checked
    />
    <label for="${value.id}">"${value.value}"</label>
    <button class="dropdown__remove js-remove">
    <span class="u-visually-hidden">Remove</span>
    </button>
  </li>
`;

// Remove the event handlers for adding and removing tags
// So the filter count doesn't count double for the text filter and checkbox
TextFilter.prototype.handleAddEvent = function() {};
TextFilter.prototype.handleRemoveEvent = function() {};

TextFilter.prototype.appendCheckbox = function(value) {
  if (!this.checkboxList) {
    this.appendCheckboxList();
  }
  const opts = {
    id: this.id + this.checkboxIndex.toString(),
    name: this.name,
    value: _escape(value.replace(/["]+/g, ''))
  };
  const checkbox = $(template_checkbox(opts));
  checkbox.appendTo(this.checkboxList.$elm);
  checkbox.find('input').change();
  this.$input.val('');
  this.checkboxIndex++;
};

TextFilter.prototype.appendCheckboxList = function() {
  const $checkboxes = $(
    '<ul class="js-filter dropdown__selected" data-filter="checkbox" data-removable="true"></ul>'
  );
  this.$elm.find('label').after($checkboxes);
  this.checkboxList = new CheckboxFilter($checkboxes);
  this.checkboxList.name = this.name;
};
