import { default as Filter } from './filter-base.js';

export default function SelectFilter(elm) {
  Filter.call(this, elm);
  this.$input = this.$elm.find('select');
  this.name = this.$input.attr('name');
  this.requiredDefault = this.$elm.data('required-default') || null; // If a default is required
  this.loadedOnce = false;
  this.$input.on('change', this.handleChange.bind(this));

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
  this.$input.change(); // TODO: jQuery deprecation
};

SelectFilter.prototype.handleChange = function(e) {
  var $input = $(e.target);
  var value = $input.val();
  var $optElement = $input.find(`option[value="${value}"]`);
  var eventName;

  // Handles change for select box filter tags when data-filter-change="true" is present
  if ($input.data('had-value') && value.length > 0) {
    eventName = 'filter:renamed';
  } else if (value.length > 0) {
    eventName = 'filter:added';
    $input.data('had-value', true);
  } else {
    eventName = 'filter:removed';
    $input.data('had-value', false);
  }
  var fireTrigger = $input.data('filter-change');
  if (fireTrigger) {
    if ($input.data('removeable-filter')) {
      $input.trigger(eventName, [
        {
          key: $input.attr('id'),
          value: this.formatValue($input, $optElement.text()),
          name: this.name,
          nonremovable: false,
          lineType: $optElement.data('line-type') ? `${$optElement.data('line-type')} - ` : '',
          loadedOnce: $input.data('loaded-once') || true
        }
      ]);
    }
    else {
      $input.trigger(eventName, [
        {
          key: $input.attr('id'),
          value: this.formatValue($input, $optElement.text()),
          name: this.name,
          nonremovable: true
        }
      ]);
   }
  }
};
