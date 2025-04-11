/**
 *
 */
import Dropdown from './dropdowns.js';
import Listeners from './listeners.js';

export function CalendarTooltip(content, $container) {
  this.$content = $(content);
  this.$container = $container;
  this.$close = this.$content.find('.js-close');
  this.$dropdown = this.$content.find('.dropdown');
  this.exportDropdown = new Dropdown(this.$dropdown, {
    checkboxes: false
  });

  this.events = new Listeners();
  this.events.on(this.$close, 'click', this.close.bind(this));
  this.events.on($(document.body), 'click', this.handleClickAway.bind(this));

  this.$container.addClass('is-active');
}

CalendarTooltip.prototype.handleClickAway = function(e) {
  const $target = $(e.target);
  if (
    !this.$content.has($target).length &&
    !this.$container.has($target).length
  ) {
    this.close();
  }
};

CalendarTooltip.prototype.close = function() {
  this.$content.remove();
  this.exportDropdown.destroy();
  this.$container.removeClass('is-active');
  this.$container.trigger('focus');
  this.events.clear();
};
