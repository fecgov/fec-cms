'use strict';

var $ = require('jquery');
require('perfect-scrollbar/jquery')($);

var listeners = require('./listeners');

var KEYCODE_ESC = 27;
var KEYCODE_ENTER = 13;

var defaultOpts = {
  checkboxes: true
};

/**
 * Dropdown toggles
 * @constructor
 * @param {string} selector - CSS selector for the fieldset that contains everything
 * @param {object} opts - Options
 */
function Dropdown(selector, opts) {
  this.opts = $.extend({}, defaultOpts, opts);

  this.isOpen = false;

  this.$body = $(selector);
  this.$button = this.$body.find('.dropdown__button');
  this.$panel = this.$body.find('.dropdown__panel');

  if (this.opts.checkboxes) {
    this.$selected = this.$body.find('.dropdown__selected');
    this.$panel.on(
      'keyup',
      'input[type="checkbox"]',
      this.handleCheckKeyup.bind(this)
    );
    this.$panel.on(
      'change',
      'input[type="checkbox"]',
      this.handleCheck.bind(this)
    );
    this.$panel.on(
      'click',
      '.dropdown__item--selected',
      this.handleDropdownItemClick.bind(this)
    );

    this.$selected.on(
      'click',
      'input[type="checkbox"]',
      this.handleSelectedInputClick.bind(this)
    );
    this.$selected.on(
      'click',
      '.dropdown__remove',
      this.handleRemoveClick.bind(this)
    );

    if (this.isEmpty()) {
      this.removePanel();
    }
  }

  $(document.body).on('tag:removeAll', this.handleClearFilters.bind(this));

  this.$button.on('click', this.toggle.bind(this));

  this.events = new listeners.Listeners();
  this.events.on(document.body, 'click', this.handleClickAway.bind(this));
  this.events.on(document.body, 'focusin', this.handleFocusAway.bind(this));
  this.events.on(document.body, 'keyup', this.handleKeyup.bind(this));

  // Set ARIA attributes
  this.$button.attr('aria-haspopup', 'true');
  this.$panel.attr('aria-label', 'More options');
}

Dropdown.prototype.toggle = function(e) {
  e.preventDefault();
  var method = this.isOpen ? this.hide : this.show;
  method.apply(this);

  return false;
};

Dropdown.prototype.show = function() {
  this.$panel.attr('aria-hidden', 'false');
  this.$panel.perfectScrollbar({ suppressScrollX: true });
  this.$panel.find('input[type="checkbox"]:first').focus();
  this.$button.addClass('is-active');
  this.isOpen = true;
};

Dropdown.prototype.hide = function() {
  this.$panel.attr('aria-hidden', 'true');
  this.$button.removeClass('is-active');
  this.isOpen = false;
};

Dropdown.prototype.handleClickAway = function(e) {
  var $target = $(e.target);
  if (!this.$body.has($target).length) {
    this.hide();
  }
};

Dropdown.prototype.handleFocusAway = function(e) {
  var $target = $(e.target);
  if (
    this.isOpen &&
    !this.$panel.has($target).length &&
    !this.$panel.is($target) &&
    !$target.is(this.$button)
  ) {
    this.hide();
  }
};

Dropdown.prototype.handleKeyup = function(e) {
  if (e.keyCode === KEYCODE_ESC) {
    if (this.isOpen) {
      this.hide();
      this.$button.focus();
    }
  }
};

Dropdown.prototype.handleCheckKeyup = function(e) {
  if (e.keyCode === KEYCODE_ENTER) {
    $(e.target)
      .prop('checked', true)
      .change();
  }
};

Dropdown.prototype.handleCheck = function(e) {
  var $input = $(e.target);
  if ($input.is(':checked')) {
    this.selectItem($input);
  }
};

Dropdown.prototype.handleDropdownItemClick = function(e) {
  var $button = $(e.target);
  var $input = this.$selected.find('#' + $button.data('label'));

  if (!$button.hasClass('is-checked')) {
    $input.click();
  }
};

Dropdown.prototype.handleSelectedInputClick = function(e) {
  var $button = this.$panel.find('button[data-label=' + e.target.id + ']');

  $button.toggleClass('is-checked');
};

Dropdown.prototype.handleCheckboxRemoval = function($input) {
  var $item = $input.parent();
  var $label = $input.parent().find('label');
  var $button = this.$panel.find(
    'button[data-label="' + $input.attr('id') + '"]'
  );

  if ($button.length > 0) {
    $button.parent().append($input);
    $button.parent().append($label);
    $button.remove();

    $item.remove();
  }
};

Dropdown.prototype.handleRemoveClick = function(e, opts) {
  var $input = $(e.target)
    .parent()
    .find('input');

  // tag removal
  if (opts) {
    $input = this.$selected.find('#' + opts.key);
  }

  this.handleCheckboxRemoval($input);
};

// "Clear all filters" will remove unchecked dropdown checkboxes
Dropdown.prototype.handleClearFilters = function() {
  var self = this;
  if (this.$selected) {
    this.$selected.find('input:checkbox:not(:checked)').each(function() {
      self.handleCheckboxRemoval($(this));
    });
  }
};

Dropdown.prototype.selectItem = function($input) {
  var $item = $input.parent('.dropdown__item');
  var $label = $item.find('label');
  var prev = $item.prevAll('.dropdown__item');
  var next = $item.nextAll('.dropdown__item');

  $item.after(
    '<li class="dropdown__item">' +
      '<button class="dropdown__item--selected is-checked"' +
      ' data-label="' +
      $label.attr('for') +
      '" >' +
      $label.text() +
      '</button></li>'
  );

  this.$selected.append($item);

  $item.append(
    '<button class="dropdown__remove">' +
      '<span class="u-visually-hidden">Remove</span></button>'
  );

  if (!this.isEmpty()) {
    if (next.length) {
      $(next[0])
        .find('input[type="checkbox"]')
        .focus();
    } else if (prev.length) {
      $(prev[0])
        .find('input[type="checkbox"]')
        .focus();
    }
  } else {
    //this.removePanel();
    this.$selected.find('input[type="checkbox"]').focus();
  }
};

Dropdown.prototype.removePanel = function() {
  this.$panel.remove();
  this.$button.remove();
};

Dropdown.prototype.isEmpty = function() {
  return this.$panel.find('input').length === 0;
};

Dropdown.prototype.destroy = function() {
  this.events.clear();
};

module.exports = { Dropdown: Dropdown };
