
/* TableSwitcher
 * For switching between efile and processed results
 * All this does toggle the visibility of the appropriate message
 * And trigger an event with a set of options that is then received by DataTable
 */

/**
 * 
 * @param {string} control - the selector text like '.js-table-switcher'
 * @param {Object} opts - 
 * @param {Object} opts.efiling - {path[], dataType: 'efiling', hideColumns: '.hide-efiling', paginator()}
 * @param {Object} opts.processed - {dataType: 'processed', hideColumns: '.hide-processed', paginator()}
 */
export default function TableSwitcher(control, opts) {
  this.$control = $(control);
  this.opts = opts;
  this.$control.on('change', this.handleChange.bind(this));
}

TableSwitcher.prototype.init = function() {
  const table = this.$control.find('input:checked').val();
  const opts = this.opts[table];
  this.$control.trigger('table:switch', opts);
};

TableSwitcher.prototype.handleChange = function(e) {
  const table = $(e.target).val();
  const opts = this.opts[table];
  this.toggleMessage(table);
  this.$control.trigger('table:switch', opts);
};

TableSwitcher.prototype.toggleMessage = function(table) {
  // Hide the visible message and show the message for the selected toggle
  this.$control
    .find('.js-table-switcher-message[aria-hidden="false"]')
    .attr('aria-hidden', true);
  this.$control.find('#' + table + '-message').attr('aria-hidden', false);
};
