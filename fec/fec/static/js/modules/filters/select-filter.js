'use strict';

var $ = require('jquery');

var Filter = require('./filter-base.js').Filter;

function SelectFilter(elm) {
  Filter.call(this, elm);
  this.$input = this.$elm.find('select');
  this.name = this.$input.attr('name');
  this.requiredDefault = this.$elm.data('required-default') || null; // If a default is required
  this.loadedOnce = false;

  this.setRequiredDefault();
}

SelectFilter.prototype = Object.create(Filter.prototype);
SelectFilter.constructor = SelectFilter;

SelectFilter.prototype.setRequiredDefault = function() {
  if (this.requiredDefault) {
    // If there's an empty "Select an option" option, remove it
    this.$input.find('option[value=""]').remove();
    this.setValue(this.requiredDefault);
  }
};

SelectFilter.prototype.fromQuery = function(query) {
  this.setValue(query[this.name]);
};

SelectFilter.prototype.setValue = function(value) {
  this.$input.find('option[selected]').prop('selected', false);
  this.$input.find('option[value="' + value + '"]').prop('selected', true);
  this.$input.change();
};

module.exports = { SelectFilter: SelectFilter };
