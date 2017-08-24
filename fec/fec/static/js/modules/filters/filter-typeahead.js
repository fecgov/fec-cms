'use strict';

/* global API_LOCATION, API_VERSION, API_KEY */

var $ = require('jquery');
var URI = require('urijs');
var _ = require('underscore');
var typeahead = require('../typeahead');
var helpers = require('../helpers');

var ID_PATTERN = /^\w{9}$/;

function slugify(value) {
  return value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9:._-]/gi, '');
}

function formatLabel(datum) {
  return datum.name ?
    datum.name + ' (' + datum.id + ')' :
    '"' + stripQuotes(datum.id) + '"';
}

function formatId(value) {
  return slugify(value) + '-checkbox';
}

function stripQuotes(value) {
  return value.replace(/["]+/g, '');
}


var textDataset = {
  display: 'id',
  source: function(query, syncResults) {
    syncResults([{id: helpers.sanitizeValue(query)}]);
  },
  templates: {
    suggestion: function(datum) {
      return '<span>Search for: "' + datum.id + '"</span>';
    }
  }
};

var FilterTypeahead = function(selector, dataset, allowText) {
  this.$elm = $(selector);
  this.dataset = dataset;
  this.allowText = allowText;

  this.$field = this.$elm.find('input[type="text"]');
  this.fieldName = this.$elm.data('name') || this.$field.attr('name');
  this.$button = this.$elm.find('button');
  this.$selected = this.$elm.find('.dropdown__selected');

  this.$elm.on('change', 'input[type="text"]', this.handleChange.bind(this));
  this.$elm.on('change', 'input[type="checkbox"]', this.handleCheckbox.bind(this));
  this.$elm.on('click', '.dropdown__remove', this.removeCheckbox.bind(this));

  this.$elm.on('mouseenter', '.tt-suggestion', this.handleHover.bind(this));
  $('body').on('filter:modify', this.changeDataset.bind(this));

  this.$field.on('typeahead:selected', this.handleSelect.bind(this));
  this.$field.on('typeahead:autocomplete', this.handleAutocomplete.bind(this));
  this.$field.on('typeahead:render', this.setFirstItem.bind(this));
  this.$field.on('keyup', this.handleKeypress.bind(this));
  this.$button.on('click', this.handleSubmit.bind(this));

  $(document.body).on('tag:removed', this.removeCheckbox.bind(this));
  $(document.body).on('tag:removeAll', this.removeAllCheckboxes.bind(this));

  this.typeaheadInit();
  this.disableButton();
};

FilterTypeahead.prototype.typeaheadInit = function() {
  var opts = {minLength: 3, hint: false, highlight: true};
  if (this.allowText && this.dataset) {
    this.$field.typeahead(opts, textDataset, this.dataset);
  } else if (this.allowText && !this.dataset) {
    this.$field.typeahead(opts, textDataset);
  } else {
    this.$field.typeahead(opts, this.dataset);
  }

  this.$elm.find('.tt-menu').attr('aria-live', 'polite');
};

FilterTypeahead.prototype.setFirstItem = function() {
  // Set the firstItem to a datum upon each rendering of results
  // This way clicking enter or the button will submit with this datum
  this.firstItem = arguments[1];
  // Add a hover class to the first item to indicate it will be selected
  $(this.$elm.find('.tt-suggestion')[0]).addClass('tt-cursor');
  if (this.$elm.find('.tt-suggestion').length > 0) {
    this.enableButton();
  }
};

FilterTypeahead.prototype.handleSelect = function(e, datum) {
  var id = formatId(datum.id);
  this.appendCheckbox({
    name: this.fieldName,
    value: datum.id,
    datum: datum
  });
  this.datum = null;

  this.$elm.find('label[for="' + id + '"]').addClass('is-loading');

  this.$button.focus().addClass('is-loading');
};

FilterTypeahead.prototype.handleAutocomplete = function(e, datum) {
  this.datum = datum;
};

FilterTypeahead.prototype.handleKeypress = function(e) {
  this.handleChange();

  if (e.keyCode === 13) {
    this.handleSubmit(e);
  }
};

FilterTypeahead.prototype.handleChange = function() {
  if ((this.allowText && this.$field.typeahead('val').length > 1) || this.datum) {
    this.enableButton();
  } else if (this.$field.typeahead('val').length === 0 ||
    (!this.allowText && this.$field.typeahead('val').length < 3)) {
    this.datum = null;
    this.disableButton();
  }
};

FilterTypeahead.prototype.handleCheckbox = function(e) {
  var $input = $(e.target);
  var id = $input.attr('id');
  var $label = this.$elm.find('label[for="' + id + '"]');
  var loadedOnce = $input.data('loaded-once') || false;

  if (loadedOnce) {
    $label.addClass('is-loading');
  }

  $input.data('loaded-once', true);
};

FilterTypeahead.prototype.removeCheckbox = function(e, opts) {
  var $input = $(e.target);

  // tag removal
  if (opts) {
    $input = this.$selected.find('#' + opts.key);
  }

  $input.closest('li').remove();
};

FilterTypeahead.prototype.removeAllCheckboxes = function() {
  this.$selected.empty();
};

FilterTypeahead.prototype.handleHover = function() {
  this.$elm.find('.tt-suggestion.tt-cursor').removeClass('tt-cursor');
};

FilterTypeahead.prototype.handleSubmit = function(e) {
  if (this.datum) {
    this.handleSelect(e, this.datum);
  } else if (!this.datum && !this.allowText) {
    this.handleSelect(e, this.firstItem);
  } else if (this.allowText && this.$field.typeahead('val').length > 0) {
    this.handleSelect(e, {id: this.$field.typeahead('val')});
  }
};

FilterTypeahead.prototype.clearInput = function() {
  this.$field.typeahead('val', null).change();
  this.disableButton();
};

FilterTypeahead.prototype.enableButton = function() {
  this.searchEnabled = true;
  this.$button.removeClass('is-disabled').attr('tabindex', '1').attr('disabled', false);
};

FilterTypeahead.prototype.disableButton = function() {
  this.searchEnabled = false;
  this.$button.addClass('is-disabled').attr('tabindex', '-1').attr('disabled', false);
};

FilterTypeahead.prototype.checkboxTemplate = _.template(
  '<li>' +
    '<input ' +
      'id="{{id}}" ' +
      'name="{{name}}" ' +
      'value="{{value}}" ' +
      'type="checkbox" ' +
      'checked' +
    '/>' +
    '<label for="{{id}}">{{label}}</label>' +
    '<button class="dropdown__remove">' +
      '<span class="u-visually-hidden">Remove</span>' +
    '</button>' +
  '</li>',
  {interpolate: /\{\{(.+?)\}\}/g}
);

FilterTypeahead.prototype.appendCheckbox = function(opts) {
  var data = this.formatCheckboxData(opts);

  if (this.$elm.find('#' + data.id).length) {
    return;
  }
  var checkbox = $(this.checkboxTemplate(data));
  checkbox.appendTo(this.$selected);
  checkbox.find('input').change();
  this.clearInput();
};

FilterTypeahead.prototype.formatCheckboxData = function(input) {
  var output = {
    name: input.name,
    label: input.datum ? formatLabel(input.datum) : stripQuotes(input.value),
    value: stripQuotes(input.value),
    id: this.fieldName + '-' + formatId(input.value)
  };

  return output;
};

FilterTypeahead.prototype.getFilters = function(values) {
  var self = this;
  if (this.dataset) {
    var dataset = this.dataset.name + 's';
    var idKey = this.dataset.name + '_id';
    var ids = values.filter(function(value) {
      return ID_PATTERN.test(value);
    });
    values.forEach(function(value) {
      self.appendCheckbox({
        name: self.fieldName,
        label: ID_PATTERN.test(value) ? 'Loading...' : value,
        value: value
      });
    });
    if (ids.length) {
      $.getJSON(
        URI(API_LOCATION)
          .path([API_VERSION, dataset].join('/'))
          .addQuery('api_key', API_KEY)
          .addQuery(idKey, ids)
          .toString()
      ).done(this.updateFilters.bind(this));
    }
  }
};

// When loading a preset checkbox filter, this will change the label of the checkbox from just ID (example: C00431445) to the full title for readability (example: OBAMA FOR AMERICA (C00431445))
FilterTypeahead.prototype.updateFilters = function(response) {
  var self = this;

  if (this.dataset) {
    var idKey = this.dataset.name + '_id';
    response.results.forEach(function(result) {
      var label = result.name + ' (' + result[idKey] + ')';
      self.$elm.find('label[for="' + self.fieldName + '-' + result[idKey] + '-checkbox"]').text(label);
      self.$elm.find('#' + self.fieldName + '-' + result[idKey] + '-checkbox').trigger('filter:renamed', [
        {
          key: self.fieldName + '-' + result[idKey] + '-checkbox',
          value: label
        }
      ]);
    });
  }
};

FilterTypeahead.prototype.changeDataset = function(e, opts) {
  // Method for changing the typeahead suggestion on the "contributor name" filter
  // when the "individual" or "committee" checkbox filter is changed
  // If the modify event names this filter, destroy it
  if (opts.filterName === this.fieldName) {
    this.$field.typeahead('destroy');
    // If the value array is only individuals and not committees
    // set the dataset to empty and re-init
    if (opts.filterValue.indexOf('individual') > -1 && opts.filterValue.indexOf('committee') < 0) {
      this.dataset = null;
      this.allowText = true;
      this.typeaheadInit();
    } else {
      // Otherwise initialize with the committee dataset
      this.dataset = typeahead.datasets.committees;
      this.typeaheadInit();
    }
  }
};

module.exports = {FilterTypeahead: FilterTypeahead};
