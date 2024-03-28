/**
 *
 */
import { download } from '../modules/download.js';
import { buildUrl } from '../modules/helpers.js';

/**
 * Runs the Totals tab at /data/elections/house/ and /data/elections/senate/
 * @class
 * @property {HTMLInputElement} exportButton - the export <button>
 */
export function HSOverviewTotalsTable() {
  this.exportButton = document.querySelector('#election-totals .js-export');
  this.init();
}

/**
 * Adds the click listener for the export button
 */
HSOverviewTotalsTable.prototype.init = function() {
  if (this.exportButton) this.exportButton.addEventListener('click', this.handleExportClick);
};

/**
 * Called when the export button is clicked, builds the query parameters and calls
 * helpers.buildUrl() with them, then hands it off to download.download()
 */
HSOverviewTotalsTable.prototype.handleExportClick = function() {
  const cycleSelector = document.querySelector('#all-elections-totals-cycle');
  const exportCycle = cycleSelector.value || window.DEFAULT_ELECTION_YEAR;

  const exportPath = ['candidates', 'totals', 'aggregates'];
  const exportQuery = {
    aggregate_by: global.context.office_code == 'H' ? 'office-state-district' : 'office-state',
    api_key: window.DOWNLOAD_API_KEY,
    election_full: true,
    election_year: exportCycle,
    is_active_candidate: true,
    office: global.context.office_code,
    sort_hide_null: false,
    sort_null_only: false,
    sort_nulls_last: false
  };

  const exportUrl = buildUrl(exportPath, exportQuery);
  download(exportUrl, false, true);
};

/**
 * Run the constructor when the page is done loading
 */
window.addEventListener('load', () => {
  new HSOverviewTotalsTable();
});
