'use strict';

var $ = require('jquery');

var Filter = require('./filter-base.js').Filter;

function CheckboxFilter(elm) {
  Filter.call(this, elm);
  this.removable = this.$elm.data('removable') || false;

  this.$elm.on('change', this.handleChange.bind(this));

  if (this.removable) {
    $(document.body).on('tag:removeAll', this.handleClearFilters.bind(this));
    this.$elm.on('click', '.js-remove', this.removeCheckbox.bind(this));
  }
}

CheckboxFilter.prototype = Object.create(Filter.prototype);
CheckboxFilter.constructor = CheckboxFilter;

CheckboxFilter.prototype.handleChange = function(e) {
  var $input = $(e.target);
  var id = $input.attr('id');
  var loadedOnce,
      eventName;

  var $label = this.$elm.find('label[for="' + id + '"]');
  loadedOnce = $input.data('loaded-once') || false;
  eventName = $input.is(':checked') ? 'filter:added' : 'filter:removed';

  if (loadedOnce) {
    $label.addClass('is-loading');

    // dropdown loading status
    if ($input.parent().hasClass('dropdown__item')) {
      this.$elm.find('button[data-name="' + $input.attr('name') + '"]').addClass('is-loading');
    }
  }

  $input.trigger(eventName, [
    {
      key: id,
      value: this.formatValue($input, $label.text()),
      loadedOnce: loadedOnce,
      filterLabel: this.$filterLabel,
      name: this.name
    }
  ]);

  $input.data('loaded-once', true);
};

CheckboxFilter.prototype.removeCheckbox = function(e, opts) {
  var $input = $(e.target);

  // tag removal
  if (opts) {
    $input = this.$selected.find('#' + opts.key);
  }

  $input.closest('li').remove();
};

// "Clear all filters" will remove unchecked checkboxes
CheckboxFilter.prototype.handleClearFilters = function() {
  var self = this;
  this.$elm.find('input:checkbox:not(:checked)').each(function () {
    self.removeCheckbox({target: this});
  });
};

module.exports = {CheckboxFilter: CheckboxFilter};
