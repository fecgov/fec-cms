// TODO - Polish the resize functionality
/**
 * The code that runs the in-page iframe, though the same vars will apply to aggregate-totals-box.
 * These dataset values are passed from the <script> to the <iframe> and then into the <aside>.
 * Some implementation options:
 * To have the new element replace an element already on the page, give the element to replaced a class of `gov-fec-agg-tots`
 * @param {string} `data-action=` - ["raised"|"spending"] Controls whether to show money raised (default) or spent.
 * @param {string} `data-theme` - ["light"|"dark"] Default: "light"
 * @param {string} `data-office-control` - ["none"|null] Optional. Provide a query selector for an external office control.
 * Use 'none' to prevent any office control from being built. The tool will compare exactly one office.
 * If no control is specified (or prevented), one will be created.
 * @param {string} `data-year-control` - ["none"|null] Optional. Provide a query selector for an external year control.
 * Use 'none' to prevent any year control from being built. The tool will compare exactly one year.
 * If no control is specified (or prevented), one will be created.
 * @param {string} `data-election-year` - Must be set for single-year implementations.
 * If provided for multi-year views, this is the starting election year displayed.
 * @param {string} `data-office` - ["H"|"P"|"S"] Optional. (House, President, Senate) Which race to show first (or only). Default: "P"
 * If no year is provided, the internal office control will be the tabs/buttons/radios rather than the <select>
 */

/**
 * @fileoverview This file runs the show for embedded Aggregate Totals
 * It's the path for Aggregate Totals on non-fec pages or for otherwise building and controlling the <iframe> where the box will live.
 * @copyright 2019 Federal Election Commission
 * @license CC0-1.0
 * @owner  fec.gov
 * @version 1.0
 * TODO - How should we handle things like this?
 */

// For when we have both internal controls
const breakPointsAndHeights_full = [
  { widthLTE: 600, height: 377 },
  { widthLTE: 677, height: 236 },
  { widthLTE: 5000, height: 236 }
];
// For when we have an internal office control
const breakPointsAndHeights_office = [
  { widthLTE: 600, height: 340 },
  { widthLTE: 650, height: 340 },
  { widthLTE: 675, height: 264 },
  { widthLTE: 5000, height: 264 }
];
// For when we have no internal controls
const breakPointsAndHeights_mini = [
  { widthLTE: 600, height: 276 },
  { widthLTE: 800, height: 246 },
  { widthLTE: 5000, height: 185 }
];

// Includes
// (none)

/**
 * AggregateTotalsFrame constructor
 * @param {Element} callingScriptElement
 */
function AggregateTotalsFrame() {
  this.scriptElement; // The <script>
  this.element; // The HTML element affected by boxbreakPointsAndHeights
  this.breakpoints = breakPointsAndHeights_full;
  this.init();
}

/**
 * Sets values that will be needed by and/or transferred into the <iframe>
 */
AggregateTotalsFrame.prototype.init = function() {
  this.scriptElement = document.currentScript; // The <script> on the page

  // Build the element
  this.element = buildElement(this.scriptElement);

  // Which sizes of breakpoints do we need to watch?
  let dataset = this.scriptElement.dataset;
  if (
    (dataset['officeControl'] && dataset['yearControl']) ||
    (dataset['officeControl'] == 'none' && dataset['yearControl'] == 'none')
  ) {
    this.breakpoints = breakPointsAndHeights_mini;
  } else if (dataset['yearControl'] == 'none') {
    this.breakpoints = breakPointsAndHeights_office;
  }

  // Add resize listeners to that new element
  this.element.contentWindow.addEventListener(
    'resize',
    this.handleResize.bind(this)
  );

  this.handleResize();
};

/**
 * Adjusts the <iframe> height when the window width changes
 */
AggregateTotalsFrame.prototype.handleResize = function(e = null) {
  if (e) e.preventDefault();
  let newWidth = this.element.offsetWidth;
  let newHeight;
  for (let i = 0; i < this.breakpoints.length; i++) {
    if (newWidth <= this.breakpoints[i].widthLTE) {
      newHeight = this.breakpoints[i].height;
      break;
    }
  }
  this.element.setAttribute('height', newHeight);
};

/**
 * Builds the <iframe> and puts it into the page
 * @param {HTMLScriptElement} scriptElement - Used to transfer dataset from <script> to <iframe>
 * @return {HTMLObjectElement} - An <iframe> element that has been inserted into the page.
 */
function buildElement(scriptElement) {
  let toReturn = document.createElement('iframe');
  toReturn.setAttribute(
    'id',
    'gov_fec_at_' + Math.floor(Math.random() * 10000)
  ); // Random so we can have multiple on a page, if needed

  // We're only going to build the iframe and not the content in it
  toReturn.setAttribute('style', 'width: 100% !important; margin: 0;');
  toReturn.setAttribute('allowtransparency', 'true');
  toReturn.setAttribute('frameborder', '0');
  // toReturn.setAttribute('scrolling', 'no'); // TODO - re-enable
  toReturn.setAttribute('title', 'Election Totals | FEC.gov');

  // Since we're going from a <script> to an <iframe>, we need to convey the dataset into the new <iframe>
  if (scriptElement.dataset) {
    for (let attr in scriptElement.dataset) {
      toReturn.dataset[attr] = scriptElement.dataset[attr];
    }
  }
  toReturn.setAttribute(
    'src',
    'http://127.0.0.1:8000/widgets/aggregate-totals/'
  ); // TODO - finalize this

  // The default in-page element to replace
  let domElementToReplace = document.querySelector('div.gov-fec-agg-tots');

  // If there's a default element to replace
  // else put it in the page right before this <script>
  if (domElementToReplace) domElementToReplace.replaceWith(toReturn);
  else scriptElement.parentElement.insertBefore(toReturn, scriptElement);

  return toReturn;
}

new AggregateTotalsFrame();
