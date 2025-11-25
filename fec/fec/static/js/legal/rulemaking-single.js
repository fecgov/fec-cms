/**
 *
 */
const canPdf = navigator.pdfViewerEnabled || false;

export default function RulemakingSingle() {
  this.init();
}

/**
 * Add listeners and open the first doc in the pdf viewer
 */
RulemakingSingle.prototype.init = function() {
  // Add listeners for the PDF links
  const pdfLinks = document.querySelectorAll('a.embed-pdf');
  pdfLinks.forEach(link => {
    link.addEventListener('click', this.handlePdfLinkClick.bind(this));
  });

  // Start by opening a specific doc?
  const thisUrl = new URL(location);
  const idToOpen = thisUrl.searchParams.get('doc_id');
  const elToOpen = document.querySelector(`[data-doc_id="${idToOpen}"]`);
  if (elToOpen) openEmbeddedPdf(elToOpen);
  else openEmbeddedPdf(pdfLinks[0]);

  // Make the columns sortable
  const sortableColumns = document.querySelectorAll('th.sorting');
  sortableColumns.forEach(th => {
    th.addEventListener('click', this.handleSortableThClick.bind(this));
  });
};

/**
 * Swallows the default event and calls {@link openEmbeddedPdf}
 * @param {PointerEvent} e
 */
RulemakingSingle.prototype.handlePdfLinkClick = function(e) {
  e.preventDefault();
  openEmbeddedPdf(e.target);
};

/**
 * @param {HTMLElement} clickedEl
 */
function openEmbeddedPdf(clickedEl) {
  // Unselect the current row(s)
  const currentRow = document.querySelectorAll('tr.row-active');
  currentRow.forEach(row => { row.classList.remove('row-active'); });
  // Select the new row(s)
  const doc_id = clickedEl.dataset.doc_id;
  const sharedLinks = document.querySelectorAll(`.embed-pdf[data-doc_id="${doc_id}"]`);
  sharedLinks.forEach(link => {
    const parentRow = link.closest('tr');
    parentRow.classList.add('row-active');
  });
  // Find the URL
  const url = clickedEl.href;
  let urlText = url.replaceAll('/', '<wbr>/<wbr>'); // To tell the page we want to break around slashes
  urlText = urlText.replaceAll('_', '<wbr>_<wbr>'); // and underscores
  urlText = `<a href="${url}" target="_blank">${urlText}</a>`;
  // Find the objects
  const urlHolder = document.querySelector('.embedded-pdf-url span:last-child');
  const pdfViewerObj = document.querySelector('object.embed-viewer');
  const pdfViewerFrame = document.querySelector('iframe.embed-viewer');
  // If the objects exist, put the URL and PDF into it/them
  if (pdfViewerObj || pdfViewerFrame) urlHolder.innerHTML = urlText;

  if (pdfViewerObj) {
    pdfViewerObj.innerHTML = '';
    pdfViewerObj.data = url;
  }
  if (pdfViewerFrame) pdfViewerFrame.src = url;

  // Update this page's URL
  const thisUrl = new URL(location);
  thisUrl.searchParams.set('doc_id', doc_id);
  history.pushState({}, '', thisUrl);
}

/**
 *
 * @param {NodeList} rows - All the `<tr>` to be sorted
 * @param {Number} sortCol0 - The column to use to sort. 0-indexed.
 * @param {('asc'|'desc')} sortDir0 - Direction to sort.
 * @param {(0|false)} sortCol1 - If 0, will sort column 0 as a secondary asc sort. If false, no secondary column sort
 */
function sortTableRows(rows, sortCol0, sortDir0, sortCol1) {
  // Which rows are we sorting?
  const sortingArray = [];
  rows.forEach(row => {
    sortingArray.push({
      primary: row.querySelectorAll('td')[sortCol0].innerText.toLowerCase(),
      secondary: sortCol1 === false ? '' : row.querySelectorAll('td')[sortCol1].innerText.toLowerCase(),
      tr: row
    });
  });

  sortingArray.sort((a, b) => {
    const primaryCompare = a.primary.localeCompare(b.primary);
    if (primaryCompare === 0 && a.secondary != '') return a.secondary.localeCompare(b.secondary);
    return sortDir0 === 'asc' ? primaryCompare : -primaryCompare;
  });

  // Which <tbody> are we targeting?
  const tableBody = rows[0].closest('tbody');
  // For item sorted
  sortingArray.forEach((item, i) => {
    // Add the row to the bottom of the tbody
    // (When we get through the list, all of them will have been pulled out of place and appended to the end)
    tableBody.appendChild(item.tr);
    // Apply the row bgcolor striping
    const isOddRowNum = i % 2 === 0; // we're 0-index so [1] (odd) is actually the second, which should be even
    item.tr.classList.toggle('even', !isOddRowNum);
    item.tr.classList.toggle('odd', isOddRowNum);
  });
}

RulemakingSingle.prototype.handleSortableThClick = function(e) {
  const theTable = e.target.closest('table');
  const theTHs = theTable.querySelectorAll('thead th');
  const theTRs = theTable.querySelectorAll('tbody tr');
  let colToSort = 0;
  let sortDir = 'asc';
  /* unselect other TH, set this one's sort value */
  theTHs.forEach((th, i) => {
    // For the not-clicked columns
    if (th != e.target) {
      th.classList = 'sorting';
    } else {
      colToSort = i;
      sortDir = th.classList.contains('sorting_asc') ? 'desc' : 'asc';
      th.classList = `sorting sorting_${sortDir}`;
    }
  });
  sortTableRows(theTRs, colToSort, sortDir, colToSort === 1 ? 0 : false);
};

/**
 * Kick it off
 */
document.addEventListener('DOMContentLoaded', () => {
  if (canPdf) new RulemakingSingle();
});
