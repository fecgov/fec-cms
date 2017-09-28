'use strict';

var $ = require('jquery');
window.$ = window.jQuery = $;

var Filter = require('./filter-base.js').Filter;

/* ToggleFilter that has to fire a custom event */
function ToggleFilter(elm) {
  Filter.call(this, elm);
  this.removeOnSwitch = this.$elm.data('remove-on-switch') || false;
  this.ignoreCount = this.$elm.data('filter-ignore-count') || false;
  this.$elm.on('change', this.handleChange.bind(this));
  this.setInitialValue();
}

ToggleFilter.prototype = Object.create(Filter.prototype);
ToggleFilter.constructor = ToggleFilter;

ToggleFilter.prototype.fromQuery = function(query) {
  this.$elm.find('input[value="' + query[this.name] + '"]').prop('checked', true).change();
};

ToggleFilter.prototype.handleChange = function(e) {
  var $input = $(e.target);
  var value = $(e.target).data('tag-value');
  var eventName = this.loadedOnce ? 'filter:renamed' : 'filter:added';
  this.$elm.trigger(eventName, [
    {
      key: this.name + '-toggle',
      value: this.formatValue($input, value),
      loadedOnce: this.loadedOnce || false,
      name: this.name,
      nonremovable: true,
      removeOnSwitch: this.removeOnSwitch,
      ignoreCount: this.ignoreCount
    }
  ]);

  this.loadedOnce = true;
};

ToggleFilter.prototype.setInitialValue = function() {
  // If a toggle is checked by default in the DOM, call handleChange()
  var $checked = this.$elm.find('input:checked');
  if ($checked.length > 0) {
    this.handleChange({target: $checked});
  }
};

module.exports = {ToggleFilter: ToggleFilter};
