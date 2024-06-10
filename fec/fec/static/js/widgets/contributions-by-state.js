// TODO - Polish the resize functionality
/**
 * @fileoverview This file runs the show for the embedded Where Contributions Come From widget
 * in cooperation with data-map
 * @copyright 2019 Federal Election Commission
 * @license CC0-1.0
 * @owner  fec.gov
 * @version 1.0
 */

// For when we have both internal controls
const breakPointsAndHeights_full = [
  { widthLTE: 600, height: 377 },
  { widthLTE: 677, height: 236 },
  { widthLTE: 5000, height: 236 }
];

// Includes
// (none)

/**
 * ContributionsByStateFrame constructor
 * @param {Element} callingScriptElement
 */
function ContributionsByStateFrame() {
  this.scriptElement; // The <script>
  this.element; // The HTML element affected by boxbreakPointsAndHeights
  this.breakpoints = breakPointsAndHeights_full;
  this.init();
}

/**
 * Sets values that will be needed by and/or transferred into the <iframe>
 */
ContributionsByStateFrame.prototype.init = function() {
  this.scriptElement = document.querySelector('#js-script-contribs-by-state');//document.currentScript; // The <script> on the page

  // Build the element
  this.element = buildElement(this.scriptElement);

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
ContributionsByStateFrame.prototype.handleResize = function(e = null) {
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
    'gov_fec_cs_' + Math.floor(Math.random() * 10000)
  ); // Random so we can have multiple on a page, if needed

  // We're only going to build the iframe and not the content in it
  toReturn.setAttribute('style', 'width: 100% !important; margin: 0;');
  toReturn.setAttribute('allowtransparency', 'true');
  toReturn.setAttribute('frameborder', '0');
  // toReturn.setAttribute('scrolling', 'no'); // TODO - re-enable
  toReturn.setAttribute('title', 'Contributions By State? | FEC.gov');

  // Since we're going from a <script> to an <iframe>, we need to convey the dataset into the new <iframe>
  if (scriptElement.dataset) {
    for (let attr in scriptElement.dataset) {
      toReturn.dataset[attr] = scriptElement.dataset[attr];
    }
  }
  toReturn.setAttribute(
    'src',
    'http://127.0.0.1:8000/widgets/contributions-by-state/'
  ); // TODO - finalize this

  // The default in-page element to replace
  let domElementToReplace = document.querySelector(
    'div.gov_fec_contribs_by_state'
  );

  // If there's a default element to replace
  // else put it in the page right before this <script>
  if (domElementToReplace) domElementToReplace.replaceWith(toReturn);
  else scriptElement.parentElement.insertBefore(toReturn, scriptElement);

  return toReturn;
}

new ContributionsByStateFrame();
