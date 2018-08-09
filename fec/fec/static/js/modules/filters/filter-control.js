'use strict';

var $ = require('jquery');

function FilterControl($selector) {
  this.$element = $selector;
  this.formType = this.getFormType();
  this.modifiesFilter = this.$element.data('modifies-filter');
  this.modifiesProperty = this.$element.data('modifies-property');

  this.$element.on('change', this.handleChange.bind(this));
}

FilterControl.prototype.getFormType = function() {
  if (this.$element.find('input[type=checkbox]').length > 0) {
    return 'checkbox';
  } else if (this.$element.find('select').length > 0) {
    return 'select';
  }
};

FilterControl.prototype.getValue = function() {
  var value;
  if (this.formType === 'checkbox') {
    value = [];
    this.$element.find('input:checked').each(function() {
      value.push($(this).val());
    });
  } else if (this.formType === 'select') {
    value = this.$element.find('select').val();
  }
  return value;
};

FilterControl.prototype.handleChange = function() {
  this.$element.trigger('filter:modify', [
    {
      filterName: this.modifiesFilter,
      filterProperty: this.modifiesProperty,
      filterValue: this.getValue()
    }
  ]);
};

module.exports = { FilterControl: FilterControl };
