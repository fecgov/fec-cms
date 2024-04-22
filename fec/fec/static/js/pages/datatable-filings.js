/**
 * Data and initialization for {@link /data/filings/}
 * Creates a new TableSwitcher
 */
import { getColumns } from '../modules/column-helpers.js';
import { filings as cols_filings } from '../modules/columns.js';
import Dropdown from '../modules/dropdowns.js';
import { renderRow, renderModal } from '../modules/filings.js';
import TableSwitcher from '../modules/table-switcher.js';
import { DataTable_FEC } from '../modules/tables.js';

var filingsColumns = getColumns(cols_filings, [
  'filer_name',
  'document_type',
  'version',
  'receipt_date',
  'beginning_image_number',
  'modal_trigger'
]);

$(function() {
  const $table = $('#results');
  new DataTable_FEC($table, {
    autoWidth: false,
    tableSwitcher: true,
    title: 'Filings',
    path: ['filings'],
    columns: filingsColumns,
    rowCallback: renderRow,
    order: [[3, 'desc']],
    hideColumns: '.hide-processed',
    useFilters: true,
    useExport: true,
    callbacks: {
      afterRender: renderModal
    },
    drawCallback: function() {
      this.dropdowns = $table.find('.dropdown').map(function(idx, elm) {
        return new Dropdown($(elm), { checkboxes: false });
      });
    }
  });

  $('.panel__navigation').hide();

  new TableSwitcher('.js-table-switcher', {
    efiling: {
      path: ['efile', 'filings'],
      dataType: 'efiling',
      hideColumns: '.hide-efiling'
    },
    processed: {
      path: ['filings'],
      dataType: 'processed',
      hideColumns: '.hide-processed'
    }
  }).init();
});
