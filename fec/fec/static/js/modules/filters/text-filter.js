'use strict';

var $ = require('jquery');
var _ = require('underscore');

var Filter = require('./filter-base');
var CheckboxFilter = require('./checkbox-filter').CheckboxFilter;

function TextFilter(elm) {
  Filter.Filter.call(this, elm);

  this.id = this.$input.attr('id');

  this.$submit = this.$elm.find('button');

  this.$input.on('change', this.handleChange.bind(this));
  this.$input.on('keyup', this.handleKeyup.bind(this));
  this.$input.on('blur', this.handleBlur.bind(this));

  if (this.$input.data('inputmask')) {
    this.$input.inputmask();
  }

  this.checkboxIndex = 1;
}

TextFilter.prototype = Object.create(Filter.Filter.prototype);
TextFilter.constructor = TextFilter;

TextFilter.prototype.fromQuery = function(query) {
  var self = this;
  var values = query[this.name] ? Filter.ensureArray(query[this.name]) : [];
  values = values.reverse();
  values.forEach(function(value) {
    self.appendCheckbox(value);
  });
  return this;
};

TextFilter.prototype.handleChange = function() {
  var value = this.$input.val();
  var loadedOnce = this.$input.data('loaded-once') || false;
  var button = this.$submit;

  // set the button focus within a timeout
  // to prevent change event from firing twice
  setTimeout(function() {
    button.focus();
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

TextFilter.prototype.checkboxTemplate = _.template(
  '<li>' +
    '<input ' +
    'id="{{id}}" ' +
    'name="{{name}}" ' +
    'value="{{value}}" ' +
    'type="checkbox" ' +
    'checked' +
    '/>' +
    '<label for="{{id}}">"{{value}}"</label>' +
    '<button class="dropdown__remove js-remove">' +
    '<span class="u-visually-hidden">Remove</span>' +
    '</button>' +
    '</li>',
  { interpolate: /\{\{(.+?)\}\}/g }
);

// Remove the event handlers for adding and removing tags
// So the filter count doesn't count double for the text filter and checkbox
TextFilter.prototype.handleAddEvent = function() {};
TextFilter.prototype.handleRemoveEvent = function() {};

TextFilter.prototype.appendCheckbox = function(value) {
  if (!this.checkboxList) {
    this.appendCheckboxList();
  }
  var opts = {
    id: this.id + this.checkboxIndex.toString(),
    name: this.name,
    value: value.replace(/["]+/g, '')
  };
  var checkbox = $(this.checkboxTemplate(opts));
  checkbox.appendTo(this.checkboxList.$elm);
  checkbox.find('input').change();
  this.$input.val('');
  this.checkboxIndex++;
};

TextFilter.prototype.appendCheckboxList = function() {
  var $checkboxes = $(
    '<ul class="js-filter dropdown__selected" data-filter="checkbox" data-removable="true"></ul>'
  );
  this.$elm.find('label').after($checkboxes);
  this.checkboxList = new CheckboxFilter($checkboxes);
  this.checkboxList.name = this.name;
};

module.exports = { TextFilter: TextFilter };
